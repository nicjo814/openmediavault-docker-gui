<?php
/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2014-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

require_once("openmediavault/object.inc");
require_once("openmediavault/config.inc");
require_once("openmediavault/error.inc");
require_once("openmediavault/util.inc");
require_once("openmediavault/rpcservice.inc");
require_once("openmediavault/notify.inc");
require_once("/usr/share/omvdocker/Utils.php");
require_once("/usr/share/omvdocker/Image.php");

class OMVRpcServiceDocker extends OMVRpcServiceAbstract {
	public function getName() {
		return "Docker";  // RPC Service name. Same as in .js files
	}

	/**
	 * Get the main event message path of the service. This is a helper 
	 * function to avoid "magic numbers".
	 *
	 * @return string
	 */
	private function getEventMessagePath()
	{
		return "org.openmediavault.services.docker";
	}

	/**
	 * Get the base XPath of the service. This is a helper function to avoid 
	 * "magic numbers".
	 *
	 * @return string
	 */
	private function getXpath()
	{
		return "/config/services/docker";
	}

	/* Initialize the RPC service. Different methods of the RPC service are declared here*/
	public function initialize() {
		$this->registerMethod("getImages");
		$this->registerMethod("pullImage");
		$this->registerMethod("getImageInfo");
		$this->registerMethod("deleteImage");
		$this->registerMethod("searchImages");
		
		$this->registerMethod("getContainers");
		$this->registerMethod("runContainer");
		$this->registerMethod("startContainer");
		$this->registerMethod("stopContainer");
		$this->registerMethod("restartContainer");
		$this->registerMethod("deleteContainer");

		$this->registerMethod("getSettings");
		$this->registerMethod("setSettings");
		$this->registerMethod("getDetails");
		$this->registerMethod("getRootFolders");
		$this->registerMethod("copyDockerData");
		$this->registerMethod("executeCommand");
		$this->registerMethod("getDockerRepo");
	}

	public function getImages($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));

		$settings = $xmlConfig->get($this->getXpath());
		if (is_null($settings)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,$this->getXpath());
		}

		$objects = array();
		if($settings['enabled']) {
			if($settings["showDanglingImages"]) {
				$incDangling = false;
			} else {
				$incDangling = true;
			}

			$objects = OMVModuleDockerUtil::getImages($settings['apiPort'], $incDangling);
		}
		return $objects;
	}

	public function pullImage($params, $context) {
		$this->validateMethodContext($context,array( "role" => OMV_ROLE_ADMINISTRATOR ));
		$this->validateMethodParams($params, '{
			"type": "object",
				"properties": {
					"repository": { "type" : "string" },
						"tag": { "type" : "string" }
		}}
		');
		if(strcmp($params['tag'], "") === 0)  {
			$params['tag'] = "latest";
		}

		// Create a background process.
		$bgStatusFilename = $this->createBgProcStatus();
		$pid = $this->fork();
		if ($pid > 0)   // Parent process.
		{
			$this->initializeBgProcStatus($bgStatusFilename, $pid);
			return $bgStatusFilename;
		}

		// Child process.
		try {
			$bgOutputFilename = $this->createBgProcOutput();
			$this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);
			$cmd = "docker pull " . $params['repository'] . ":" . $params['tag'];
			$this->exec($cmd, $output, $bgOutputFilename);
			$this->finalizeBgProcStatus($bgStatusFilename, $output);

		} catch(Exception $e) {
			$this->finalizeBgProcStatus($bgStatusFilename, "", $e);
			exit(1);
		}
	}

	public function getImageInfo($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$data = file_get_contents("https://hub.docker.com/r/" . $params['repository']);
		$lines = explode("\n", $data);
		$result = "";
		if(is_array($lines)) {
			if(preg_match('/^.*1\.1\.1\.0\.0\.0\.0\.0\.0\.0\"\>(.*)$/', $lines[0], $matches)) {
				$result .= $matches[1]. "\n";
			}
			for($i = 1; $i < count($lines); $i++) {
				if(!preg_match('/^.*div.*$/', $lines[$i])) {
					$result .= $lines[$i] . "\n";
				} else {
					break;
				}
			}
			if(strcmp($result, "") === 0) {
				$result = "No information found";
			}

			return array("info" => $result);
		}
	}

	public function deleteImage($params, $context) {
		$this->validateMethodParams($params, '{
			"type": "object",
				"properties": {
					"id": { "type" : "string" }
	}}');

	$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
	$cmd = "docker rmi " . $params['id'];
	OMVModuleDockerUtil::exec($cmd,$out,$res);	
	}

	public function searchImages($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$objects = array();
		$settings = $xmlConfig->get($this->getXpath());
		if (is_null($settings)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,$this->getXpath());
		}

		$url = "http://localhost:" . $settings['apiPort'] . "/images/search?term=" . $params["name"];
		$response = OMVModuleDockerUtil::doApiCall($url);
		$data = json_decode($response);

		foreach($data as $repo) {
			switch($params['filterParam']) {
			case "all":
				array_push($objects, array("name" => $repo->name,
					"description" => $repo->description,
					"stars" => $repo->star_count));
				break;
			case "trusted":
				if($repo->is_trusted) {
					array_push($objects, array("name" => $repo->name,
						"description" => $repo->description,
						"stars" => $repo->star_count));
				}
				break;
			case "official":
				if($repo->is_official) {
					array_push($objects, array("name" => $repo->name,
						"description" => $repo->description,
						"stars" => $repo->star_count));
				}
				break;
			case "trustedofficial":
				if($repo->is_official && $repo->is_trusted) {
					array_push($objects, array("name" => $repo->name,
						"description" => $repo->description,
						"stars" => $repo->star_count));
				}
				break;
			default:
				array_push($objects, array("name" => $repo->name,
					"description" => $repo->description,
					"stars" => $repo->star_count));
				break;
			}

		}
		return $objects;
	}

	public function getContainers($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));

		$objects = array();

		$settings = $xmlConfig->get($this->getXpath());
		if (is_null($settings)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,$this->getXpath());
		}

		if($settings['enabled']) {
			$objects = OMVModuleDockerUtil::getContainers($settings['apiPort']);
		}
		return $objects;
	}

	public function runContainer($params, $context)
	{
		$this->validateMethodContext($context,array( "role" => OMV_ROLE_ADMINISTRATOR ));
		/*
		$this->validateMethodParams($params, '{
			"type": "object",
			"properties": {
				"restart": { "type" : "boolean" },
				"networkMode": { "type" : "string" },
				"portForwards": { "type" : "object", "optional" : true, "properties": {
					"hostip": { "type" : "string" },
					"hostport" : { "type" : "string" },
					"exposedPort" : { "type" : "string" },
					"customPort" : { "type" : "string" }}},
				"envVars": { "type" : "object", "optional" : true, "properties": {
					"name": { "type" : "string" },
					"value" : { "type" : "string" }}}
				"privileged": { "type" : "boolean" },
				"bindMounts": { "type" : "object", "optional" : true, "properties": {
					"from": { "type" : "string" },
					"to" : { "type" : "string" }}}
				"image": { "type" : "string" }
			}}
		');
		 */

		$cmd = "docker run -d ";

		//Check if restart checkbox is enabled
		if($params['restart']) {
			$cmd .= "--restart=always ";
		}

		//Check which networking mode is selected
		switch($params['networkMode']) {
		case "Bridge":
			$cmd .= "--net=bridge ";
			foreach($params['portForwards'] as $portForward) {
				if(!(strcmp($portForward['customPort'], "") === 0)) {
					$destport = $portForward['customPort'];
				} else {
					$destport = preg_split("'/\//'", $portForward['exposedPort'])[0];
				}
				if(!(strcmp($portForward['hostip'], "") === 0)) {
					$cmd .= "-p " . $portForward['hostip'] . ":" . $portForward['hostport'] . ":" . $destport . " ";
				}
			}
			break;
		case "Host":
			$cmd .= "--net=host ";
			break;
		case "None":
			$cmd .= "--net=none ";
			break;
		}

		//Check for environment variables
		foreach($params['envVars'] as $envVar) {
			if(!(strcmp($envVar['name'], "") === 0)) {
				$cmd .= "-e " . $envVar['name'] . "=" . $envVar['value'] . " ";
			}
		}

		//Check if privileged checkbox is enabled
		if($params['privileged']) {
			$cmd .= "--privileged ";
		}

		//Check for bind mounts
		foreach($params['bindMounts'] as $bindMount) {
			if(!(strcmp($bindMount['from'], "") === 0)) {
				$cmd .= "-v " . $bindMount['from'] . ":" . $bindMount['to'] . " ";
			}
		}

		//Check if a custom container name has been supplied
		if(!(strcmp($params['containerName'], "") === 0)) {
			$cmd .= "--name=" . $params['containerName'] . " ";
		}


		//Add image to command
		$cmd .= $params['image'] . " 2>&1";

		OMVModuleDockerUtil::exec($cmd,$out,$res);	

	}

	public function startContainer($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$cmd = "docker start " . $params['id'] . " 2>&1";
		OMVModuleDockerUtil::exec($cmd,$out,$res);	
	}

	public function stopContainer($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$cmd = "docker stop " . $params['id'] . " 2>&1";
		OMVModuleDockerUtil::exec($cmd,$out,$res);	
	}

	public function restartContainer($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$cmd = "docker restart " . $params['id'] . " 2>&1";
		OMVModuleDockerUtil::exec($cmd,$out,$res);	
	}

	public function deleteContainer($params, $context) {
		$this->validateMethodParams($params, '{
			"type": "object",
				"properties": {
					"id": { "type" : "string" }
	}}');

	$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
	$cmd = "docker rm " . $params['id'] . " 2>&1";
	OMVModuleDockerUtil::exec($cmd,$out,$res);	
	}

	public function getSettings($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));

		$dockerVersion = "0";
		$dockerVersionInfo = "";
		$cmd = "docker --version 2>&1";
		OMVUtil::exec($cmd,$out,$res);

		if(!preg_match('/^Docker version ([\d\.]+)\,.*$/', $out[0], $matches)) {
			$dockerVersionInfo = "Docker not installed";
		} else {
			$dockerVersion = $matches[1];
			$cmd = "docker version";
			unset($out);
			OMVUtil::exec($cmd,$out,$res);
			$dockerVersionInfo = implode("\n", $out);
		}
		$object = $xmlConfig->get($this->getXpath());
		if (is_null($object)) {
			throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXpath());
		}

		//$object["showDanglingImages"] = boolval($object["showDanglingImages"]);
		$object["enabled"] = boolval($object["enabled"]);
		$object["apiPort"] = intval($object["apiPort"]);
		$object["version"] = $dockerVersion;
		$object["versionInfo"] = $dockerVersionInfo;
		$object["sharedfolderref"] = $object["sharedfolderref"];

		return $object;
	}

	public function setSettings($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$this->validateMethodParams($params,'{
			"type": "object",
				"properties": {
					"enabled": {	"type": "boolean" },
						"versionInfo": {	"type": "string" },
						"version": {	"type": "string" },
						"apiPort": { "type": "integer" },
						"sharedfolderref": { "type": "string" },
						"uuid": { "type": "string" },
						"orgpath": { "type": "string" },
						"destpath": { "type": "string" }
	}}');

	//Get the old settings object
	$oldSettings = $xmlConfig->get($this->getXpath());
	if (is_null($oldSettings)) {
		throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->getXpath());
	}

	$newApiPort = $oldSettings['apiPort'];
	$sharedFolder = $oldSettings['sharedfolderref'];
	//Make sure that the plugin is enabled to avoid unnecessary restarts of the docker
	//service.
	if($params['enabled']) {
		$newApiPort = $params['apiPort'];
		if($params['sharedfolderref']) {
			$sharedFolder = $params['sharedfolderref'];
			$xpath = "//system/shares/sharedfolder[uuid='" . $params['sharedfolderref'] . "']";
			$share = $xmlConfig->get($xpath);
			$xpath = "//system/fstab/mntent[uuid='" . $share['mntentref'] . "']";
			$mntent = $xmlConfig->get($xpath);
			$absPath = rtrim(rtrim($mntent['dir'], "/") . "/" . $share['reldirpath'], "/");
		} else {
			$sharedFolder = "";
		}
		OMVModuleDockerUtil::changeDockerSettings($newApiPort, $absPath);
	}

	// Update the configuration object.
	$object = array(
		//"showDanglingImages" => array_boolval($params, "showDanglingImages"),
		"enabled" => array_boolval($params, "enabled"),
		"apiPort" => $newApiPort,
		"sharedfolderref" => $sharedFolder
	);

	if (false === $xmlConfig->replace($this->getXpath(), $object)) {
		throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED, $this->getXpath());
	}

	$dispatcher = &OMVNotifyDispatcher::getInstance();
	$dispatcher->notify(OMV_NOTIFY_MODIFY, $this->getEventMessagePath(), $object);

	return $object;
	}

	public function getDetails($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$cmd = "docker inspect " . $params['id'] . " 2>&1";
		OMVModuleDockerUtil::exec($cmd,$out,$res);
		//throw new OMVModuleDockerException($objects['details']);
		return array("details" => implode("\n\r", $out));
	}

	public function getRootFolders($params, $context)
	{
		global $xmlConfig;

		// Validate the RPC caller context.
		$this->validateMethodContext(
			$context,
			array( "role" => OMV_ROLE_ADMINISTRATOR )
		);

		// List the directory contents.
		$result = array();
		$path = sprintf("/%s", rtrim($params['path'], "/"));
		if ( strlen($path) == 0 )
			$path = "/";

		foreach (new DirectoryIterator($path) as $item)
		{
			if ($item->isDot())
				continue;
			if (!$item->isDir())
				continue;
			$result[] = $item->getFilename();
		}
		return $result;
	}

	public function copyDockerData($params, $context) {
		global $xmlConfig;
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$this->validateMethodParams($params,'{
			"type": "object",
				"properties": {
					"srcpath": {	"type": "string" },
						"sharedfolderref": {	"type": "string" }
	}}');

	$absPath = "";
	if($params['sharedfolderref']) {
		$xpath = "//system/shares/sharedfolder[uuid='" . $params['sharedfolderref'] . "']";
		$share = $xmlConfig->get($xpath);
		$xpath = "//system/fstab/mntent[uuid='" . $share['mntentref'] . "']";
		$mntent = $xmlConfig->get($xpath);
		$absPath = rtrim(rtrim($mntent['dir'], "/") . "/" . $share['reldirpath'], "/");
	}
	if((strcmp($params['srcpath'], "") === 0) || (strcmp($absPath, "") === 0)) {
		throw new OMVModuleDockerException("Either source or destination path is empty");
	}

	$srcpath = $params['srcpath'];
	$destpath = $absPath;
	OMVModuleDockerUtil::stopDockerService();		

	if(file_exists($srcpath . "/containers") && file_exists($srcpath . "/volumes")) {
		if(file_exists($srcpath . "/devicemapper/mnt")) {
			$cmd = "umount $srcpath/devicemapper/mnt/*";
			OMVUtil::exec($cmd, $out, $res);
		}
		// Create a background process.
		$bgStatusFilename = $this->createBgProcStatus();
		$pid = $this->fork();
		if ($pid > 0)   // Parent process.
		{
			$this->initializeBgProcStatus($bgStatusFilename, $pid);
			return $bgStatusFilename;
		}

		// Child process.
		try {
			$bgOutputFilename = $this->createBgProcOutput();
			$this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);
			$cmd = "cp -R $srcpath/* $destpath";
			$this->exec($cmd, $output, $bgOutputFilename);
			$this->finalizeBgProcStatus($bgStatusFilename, $output);

		} catch(Exception $e) {
			$this->finalizeBgProcStatus($bgStatusFilename, "", $e);
			exit(1);
		}
	} else {
		OMVModuleDockerUtil::startDockerService();
		throw new OMVModuleDockerException("Not a valid Docker source path specified");
	}
	OMVModuleDockerUtil::startDockerService();
	}

	public function executeCommand($params, $context) {
		$this->validateMethodContext($context,array( "role" => OMV_ROLE_ADMINISTRATOR ));
		$this->validateMethodParams($params, '{
			"type": "object",
				"properties": {
					"cmd": { "type" : "string" },
					"containerId": { "type" : "string" }
	}}
	');
	
	// Create a background process.
	$bgStatusFilename = $this->createBgProcStatus();
	$pid = $this->fork();
	if ($pid > 0)   // Parent process.
	{
		$this->initializeBgProcStatus($bgStatusFilename, $pid);
		return $bgStatusFilename;
	}

	// Child process.
	try {
		$bgOutputFilename = $this->createBgProcOutput();
		$this->updateBgProcStatus($bgStatusFilename, "outputfilename", $bgOutputFilename);
		$cmd = "docker exec -t " . $params['containerId'] . " " . $params['cmd'];
		$this->exec($cmd, $output, $bgOutputFilename);
		$this->finalizeBgProcStatus($bgStatusFilename, $output);

	} catch(Exception $e) {
		$this->finalizeBgProcStatus($bgStatusFilename, "", $e);
		exit(1);
	}
	}

	public function getDockerRepo($params, $context) {
		$this->validateMethodContext($context,array( "role" => OMV_ROLE_ADMINISTRATOR ));
		$logoPath = "/var/www/openmediavault/images/dockerrepo/";
		$baseUrl = "https://cdn.rawgit.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-repo/master/";
		$imgBase = $baseUrl . "logos/";
		$repoUrl = $baseUrl . "dockerlist.xml";

		$cmd = "mkdir -p $logoPath";
		OMVUtil::exec($cmd, $out, $res);

		$data = file_get_contents($repoUrl);
		$xml = simplexml_load_string($data);
		$objects = array();
		foreach($xml as $image) {
			copy($imgBase . $image->imageurl, $logoPath . $image->imageurl);
			$temp = array("name" => $image->name,
				"category" => $image->category,
				"logo" => $image->imageurl,
				"desc" => $image->desc,
				"repo" => $image->repo);
			array_push($objects, $temp);
		}
		return $objects;
	}

	//throw new OMVModuleDockerException($cmd);
}

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance(); // Get the "root" instance for the Services
$rpcServiceMgr->registerService(new OMVRpcServiceDocker()); // Register a new instance of the RPC service described above
