<?php
/**
 * Copyright (C) 2014 OpenMediaVault Plugin Developers
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

	/* Initialize the RPC service. Different methods of the RPC service are declared here*/
	public function initialize() {
		$this->registerMethod("getImages");
		$this->registerMethod("pullImage");
		$this->registerMethod("runImage");
		$this->registerMethod("deleteImage");
		
		$this->registerMethod("getContainers");
		$this->registerMethod("startContainer");
		$this->registerMethod("stopContainer");
		$this->registerMethod("restartContainer");
		$this->registerMethod("deleteContainer");
	}

	public function getImages($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		//TODO: Add a parameter that decides if dangling images should be displayed
		$objects = OMVModuleDockerUtil::getImages();
		return $objects;
	}

	public function pullImage($params, $context)
	{
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

	public function runImage($params, $context)
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
		case "Bridged":
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

		//Add image to command
		$cmd .= $params['image'] . " 2>&1";

		OMVModuleDockerUtil::exec($cmd,$out,$res);	

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

	public function getContainers($params, $context) {
		$this->validateMethodContext($context, array("role" => OMV_ROLE_ADMINISTRATOR));
		$objects = OMVModuleDockerUtil::getContainers();
		return $objects;
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

	
	//throw new OMVModuleDockerException($cmd);
}

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance(); // Get the "root" instance for the Services
$rpcServiceMgr->registerService(new OMVRpcServiceDocker()); // Register a new instance of the RPC service described above
