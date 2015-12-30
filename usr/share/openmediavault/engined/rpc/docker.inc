<?php
/**
 * Copyright (c) 2015 OpenMediaVault Plugin Developers
 *
 * @category OMVRpcServiceDocker
 * @package  Openmediavault-docker-gui
 * @author   OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://github.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-gui
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

require_once "openmediavault/object.inc";
require_once "openmediavault/config.inc";
require_once "openmediavault/error.inc";
require_once "openmediavault/util.inc";
require_once "openmediavault/rpcservice.inc";
require_once "openmediavault/notify.inc";
require_once "/usr/share/omvdocker/Utils.php";
require_once "/usr/share/omvdocker/Image.php";

/**
 * RPC class for the Docker GUI plugin
 *
 * @category Class
 * @package  Openmediavault-docker-gui
 * @author   OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://github.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-gui
 *
 */
class OMVRpcServiceDocker extends OMVRpcServiceAbstract
{
    /**
     * Get the name of the RPC service
     *
     * @return string
     */
    public function getName()
    {
        return "Docker";  // RPC Service name. Same as in .js files
    }

    /**
     * Get the main event message path of the service. This is a helper
     * function to avoid "magic numbers".
     *
     * @return string
     */
    private function _getEventMessagePath()
    {
        return "org.openmediavault.services.docker";
    }

    /**
     * Get the base XPath of the service. This is a helper function to avoid
     * "magic numbers".
     *
     * @return string
     */
    private function _getXpath()
    {
        return "/config/services/docker";
    }

    /**
     * Initialize the RPC service. Different methods of the RPC service are
     * declared here
     *
     * @return void
     */
    public function initialize()
    {
        $this->registerMethod("getImages");
        $this->registerMethod("pullImage");
        $this->registerMethod("deleteImage");
        $this->registerMethod("searchImages");

        $this->registerMethod("getContainers");
        $this->registerMethod("runContainer");
        $this->registerMethod("startContainer");
        $this->registerMethod("stopContainer");
        $this->registerMethod("restartContainer");
        $this->registerMethod("deleteContainer");
        $this->registerMethod("createContainer");
        $this->registerMethod("getVolumesFrom");
        $this->registerMethod("commitContainer");

        $this->registerMethod("getSettings");
        $this->registerMethod("setSettings");
        $this->registerMethod("getDetails");
        $this->registerMethod("getRootFolders");
        $this->registerMethod("copyDockerData");
        $this->registerMethod("executeCommand");
        $this->registerMethod("getDockerRepo");
    }

    /**
     * Get all Docker images
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $objects An array with all Docker images
     */
    public function getImages($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );

        $settings = $xmlConfig->get($this->_getXpath());
        if (is_null($settings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $this->_getXpath()
            );
        }

        $objects = array();
        if ($settings['enabled']) {
            if ($settings["showDanglingImages"]) {
                $incDangling = false;
            } else {
                $incDangling = true;
            }

            $objects = OMVModuleDockerUtil::getImages(
                $settings['apiPort'],
                $incDangling
            );
        }
        return $objects;
    }

    /**
     * Pull a Docker image from the Docker Hub
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function pullImage($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR)
        );
        $this->validateMethodParams(
            $params,
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"repository": { "type" : "string" },' .
            '"tag": { "type" : "string" }' .
            '}}'
        );

        if (strcmp($params['tag'], "") === 0) {
            $params['tag'] = "latest";
        }

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if ($pid > 0) {
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus(
                $bgStatusFilename,
                "outputfilename",
                $bgOutputFilename
            );
            $cmd = "docker pull \"" . $params['repository'] . ":" .
                $params['tag'] . "\"";
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);

        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    /**
     * Deletes a Docker image
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function deleteImage($params, $context)
    {
        $this->validateMethodParams(
            $params,
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"id": { "type" : "string" }' .
            '}}'
        );

        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker rmi " . $params['id'];
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Searches the Docker Hub for a specific repository
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $objects An array ith all repositories found
     */
    public function searchImages($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $objects = array();
        $settings = $xmlConfig->get($this->_getXpath());
        if (is_null($settings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        $url = "http://localhost:" . $settings['apiPort'] .
            "/images/search?term=" . $params["name"];
        $response = OMVModuleDockerUtil::doApiCall($url);
        $data = json_decode($response);

        foreach ($data as $repo) {
            switch ($params['filterParam']) {
            case "all":
                array_push(
                    $objects,
                    array(
                        "name" => $repo->name,
                        "description" => $repo->description,
                        "stars" => $repo->star_count
                    )
                );
                break;
            case "trusted":
                if ($repo->is_trusted) {
                    array_push(
                        $objects,
                        array(
                            "name" => $repo->name,
                            "description" => $repo->description,
                            "stars" => $repo->star_count
                        )
                    );
                }
                break;
            case "official":
                if ($repo->is_official) {
                    array_push(
                        $objects,
                        array(
                            "name" => $repo->name,
                            "description" => $repo->description,
                            "stars" => $repo->star_count
                        )
                    );
                }
                break;
            case "trustedofficial":
                if ($repo->is_official && $repo->is_trusted) {
                    array_push(
                        $objects,
                        array(
                            "name" => $repo->name,
                            "description" => $repo->description,
                            "stars" => $repo->star_count
                        )
                    );
                }
                break;
            default:
                array_push(
                    $objects,
                    array(
                        "name" => $repo->name,
                        "description" => $repo->description,
                        "stars" => $repo->star_count
                    )
                );
                break;
            }

        }
        return $objects;
    }

    /**
     * Get all Docker containers
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $objects An array with all containers
     */
    public function getContainers($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );

        $objects = array();

        $settings = $xmlConfig->get($this->_getXpath());
        if (is_null($settings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        if ($settings['enabled']) {
            $objects = OMVModuleDockerUtil::getContainers(
                $settings['apiPort']
            );
        }
        return $objects;
    }

    /**
     * Run a single Docker container
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function runContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR)
        );
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
        if ($params['restart']) {
            $cmd .= "--restart=always ";
        }

        //Check if privileged checkbox is enabled
        if ($params['privileged']) {
            $cmd .= "--privileged ";
        }

        //Check if time sync checkbox is enabled
        if ($params['timeSync']) {
            $cmd .= "-v /etc/localtime:/etc/localtime:ro ";
        }

        //Check which networking mode is selected
        switch ($params['networkMode']) {
        case "Bridge":
            $cmd .= "--net=bridge ";
            foreach ($params['portForwards'] as $portForward) {
                if (!(strcmp($portForward['customPort'], "") === 0)) {
                    $destport = $portForward['customPort'];
                } else {
                    $destport = preg_split(
                        "'/\//'",
                        $portForward['exposedPort']
                    )[0];
                }
                if (!(strcmp($portForward['hostip'], "") === 0)) {
                    $cmd .= "-p " . $portForward['hostip'] . ":" .
                        $portForward['hostport'] . ":" . $destport . " ";
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

        //Check if host name is specified
        if (!(strcmp($params['hostName'], "") === 0)) {
            $cmd .= "-h \"" . $params['hostName'] . "\" ";
        }

        //Check for environment variables
        foreach ($params['envVars'] as $envVar) {
            if (!(strcmp($envVar['name'], "") === 0)) {
                $cmd .= "-e " . $envVar['name'] . "=\"" . $envVar['value'] . "\" ";
            }
        }

        //Check for bind mounts
        //Container path must not be set to "/"
        //If Container path is empty a new volume is created instead
        //of bindmount
        foreach ($params['bindMounts'] as $bindMount) {
            if (strcmp($bindMount['to'], "/") === 0) {
                throw new OMVModuleDockerException(
                    "Container path must not be set to \"/\""
                );
            }
            if (!(strcmp($bindMount['from'], "") === 0)) {
                if (!(strcmp($bindMount['to'], "") === 0)) {
                    $cmd .= "-v \"" . $bindMount['from'] . "\":\"" .
                        $bindMount['to'] . "\" ";
                } else {
                    $cmd .= "-v \"" . $bindMount['from'] . "\" ";
                }
            }
        }
        
        //Check for volumes from
        foreach ($params['volumes'] as $volume) {
            if (!(strcmp($volume['from'], "") === 0)) {
                $cmd .= "--volumes-from \"" . $volume['from'] . "\" ";
            }
        }

        //Check if a custom container name has been supplied
        if (!(strcmp($params['containerName'], "") === 0)) {
            $cmd .= "--name=\"" . $params['containerName'] . "\" ";
        }
        
        //Check if extra arguments are supplied
        $extraArgs = trim($params['extraArgs']);
        if (!(strcmp($extraArgs, "") === 0)) {
            $cmd .= $extraArgs . " ";
        }

        //Add image to command
        $cmd .= "\"" . $params['image'] . "\" 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);

    }

    /**
     * Start one or multiple Docker containers
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function startContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker start " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Stop one or multiple Docker containers
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function stopContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker stop " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Restart one or multiple Docker containers
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function restartContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker restart " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Delete one or multiple Docker containers
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function deleteContainer($params, $context)
    {
        $this->validateMethodParams(
            $params,
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"id": { "type" : "string" }' .
            '}}'
        );

        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker rm " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Create a new Docker container
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function createContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker create ";

        //Check for bind mounts
        //Container path must not be set to "/"
        //If Container path is empty a new volume is created instead
        //of bindmount
        foreach ($params['bindMounts'] as $bindMount) {
            if (strcmp($bindMount['to'], "/") === 0) {
                throw new OMVModuleDockerException(
                    "Container path must not be set to \"/\""
                );
            }
            if (!(strcmp($bindMount['from'], "") === 0)) {
                if (!(strcmp($bindMount['to'], "") === 0)) {
                    $cmd .= "-v \"" . $bindMount['from'] . "\":\"" .
                        $bindMount['to'] . "\" ";
                } else {
                    $cmd .= "-v \"" . $bindMount['from'] . "\" ";
                }
            }
        }

        //Check if a custom container name has been supplied
        if (!(strcmp($params['containerName'], "") === 0)) {
            $cmd .= "--name=" . $params['containerName'] . " ";
        }

        $cmd .= "\"" . $params['imageRepo'] . "\" /bin/true";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Get all containers with volumes mounted
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $objects An array with all containers
     */
    public function getVolumesFrom($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $objects = array();
        $settings = $xmlConfig->get($this->_getXpath());
        if (is_null($settings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        if ($settings['enabled']) {
            $containers = OMVModuleDockerUtil::getContainers(
                $settings['apiPort']
            );
            foreach ($containers as $container) {
                if ($container['hasmounts']) {
                    array_push($objects, array("name" => $container['name']));
                }
            }
        }
        return $objects;
    }

    /**
     * Commit a container to a new image
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function commitContainer($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker commit " . $params['name'] . " " . $params['newImage'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
    }

    /**
     * Retrieve all plugin settings
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $object An ssociative array with all settings
     */
    public function getSettings($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );

        $dockerVersion = "0";
        $dockerVersionInfo = "";
        $cmd = "docker --version 2>&1";
        OMVUtil::exec($cmd, $out, $res);

        if (!preg_match('/^Docker version ([\d\.]+)\,.*$/', $out[0], $matches)) {
            $dockerVersionInfo = "Docker not installed";
        } else {
            $dockerVersion = $matches[1];
            $cmd = "docker version";
            unset($out);
            OMVUtil::exec($cmd, $out, $res);
            $dockerVersionInfo = implode("\n", $out);
        }
        $object = $xmlConfig->get($this->_getXpath());
        if (is_null($object)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        //$object["showDanglingImages"] = boolval(
        //$object["showDanglingImages"]);
        $object["enabled"] = boolval($object["enabled"]);
        $object["apiPort"] = intval($object["apiPort"]);
        $object["version"] = $dockerVersion;
        $object["versionInfo"] = $dockerVersionInfo;
        $object["sharedfolderref"] = $object["sharedfolderref"];

        return $object;
    }

    /**
     * Set all plugin settings
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $object An associative array with all the new settings
     */
    public function setSettings($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $this->validateMethodParams(
            $params,
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"enabled": {	"type": "boolean" },' .
            '"versionInfo": {	"type": "string" },' .
            '"version": {	"type": "string" },' .
            '"apiPort": { "type": "integer" },' .
            '"sharedfolderref": { "type": "string" },' .
            '"uuid": { "type": "string" },' .
            '"orgpath": { "type": "string" },' .
            '"destpath": { "type": "string" }' .
            '}}'
        );

        //Create the folder used for bind mounting when relocating
        //the base path
        $cmd = "mkdir -p /var/lib/docker/openmediavault";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
        unset($out);

        //Get the old settings object
        $oldSettings = $xmlConfig->get($this->_getXpath());
        if (is_null($oldSettings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }
        
        $newApiPort = $oldSettings['apiPort'];
        $sharedFolder = $oldSettings['sharedfolderref'];
        //Make sure that the plugin is enabled to avoid unnecessary restarts of
        //the docker service.
        if ($params['enabled']) {
            $newApiPort = $params['apiPort'];
            $absPath = "";
            $sharedFolder = "";
            if (!(strcmp($params['sharedfolderref'], "") === 0)) {
                $absPath = OMVRpc::exec(
                    "ShareMgmt",
                    "getPath",
                    array(
                        "uuid" => $params['sharedfolderref']
                    ),
                    $context
                );
                $sharedFolder = $params['sharedfolderref'];
            }
            OMVModuleDockerUtil::changeDockerSettings($newApiPort, $absPath);
        }

        //Get the possibly changed settings object
        $oldSettings = $xmlConfig->get($this->_getXpath());
        if (is_null($oldSettings)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        if (isset($oldSettings['dockermntent'])) {
            $tmpMntent = $oldSettings['dockermntent'];
        } else {
            $tmpMntent = "";
        }

        // Update the configuration object.
        $object = array(
            "dockermntent" => $tmpMntent,
            "enabled" => array_boolval($params, "enabled"),
            "apiPort" => $newApiPort,
            "sharedfolderref" => $sharedFolder
        );

        if (false === $xmlConfig->replace($this->_getXpath(), $object)) {
            throw new OMVException(
                OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED,
                $this->_getXpath()
            );
        }

        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(
            OMV_NOTIFY_MODIFY,
            $this->_getEventMessagePath(),
            $object
        );

        return $object;
    }

    /**
     * Get detailed info on a Docker image or container
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $object An associative array with all the new settings
     */
    public function getDetails($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker inspect " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
        //throw new OMVModuleDockerException($objects['details']);
        return array("details" => implode("\n\r", $out));
    }

    /**
     * Get logs from a Docker container
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $object An associative array with all the new settings
     */
    public function getLogs($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $cmd = "docker logs " . $params['id'] . " 2>&1";
        OMVModuleDockerUtil::exec($cmd, $out, $res);
        //throw new OMVModuleDockerException($objects['details']);
        return array("logs" => implode("\n\r", $out));
    }

    /**
     * Get folder structure for folder browser
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $result An array with folders
     */
    public function getRootFolders($params, $context)
    {
        global $xmlConfig;

        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR)
        );

        // List the directory contents.
        $result = array();
        $path = sprintf("/%s", rtrim($params['path'], "/"));
        if (strlen($path) == 0) {
            $path = "/";
        }

        foreach (new DirectoryIterator($path) as $item) {
            if ($item->isDot()) {
                continue;
            }
            if (!$item->isDir()) {
                continue;
            }
            $result[] = $item->getFilename();
        }
        return $result;
    }

    /**
     * Copy Docker data from one folder to another
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function copyDockerData($params, $context)
    {
        global $xmlConfig;
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $this->validateMethodParams(
            $params,
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"srcpath": {	"type": "string" },' .
            '"sharedfolderref": {	"type": "string" }' .
            '}}'
        );

        $absPath = "";
        if ($params['sharedfolderref']) {
            $xpath = "//system/shares/sharedfolder[uuid='" .
                $params['sharedfolderref'] . "']";
            $share = $xmlConfig->get($xpath);
            $xpath = "//system/fstab/mntent[uuid='" . $share['mntentref'] . "']";
            $mntent = $xmlConfig->get($xpath);
            $absPath = rtrim(
                rtrim(
                    $mntent['dir'], "/"
                )
                . "/" . $share['reldirpath'], "/"
            );
        }
        if ((strcmp($params['srcpath'], "") === 0) || (strcmp($absPath, "") === 0)) {
            throw new OMVModuleDockerException(
                "Either source or destination " .
                "path is empty"
            );
        }

        $srcpath = $params['srcpath'];
        $destpath = $absPath;
        OMVModuleDockerUtil::stopDockerService();

        if (file_exists($srcpath . "/containers") && file_exists($srcpath . "/volumes")) {
            if (file_exists($srcpath . "/devicemapper/mnt")) {
                $cmd = "umount $srcpath/devicemapper/mnt/*";
                OMVUtil::exec($cmd, $out, $res);
            }
            // Create a background process.
            $bgStatusFilename = $this->createBgProcStatus();
            $pid = $this->fork();
            if ($pid > 0) {
                $this->initializeBgProcStatus($bgStatusFilename, $pid);
                return $bgStatusFilename;
            }

            // Child process.
            try {
                $bgOutputFilename = $this->createBgProcOutput();
                $this->updateBgProcStatus(
                    $bgStatusFilename,
                    "outputfilename",
                    $bgOutputFilename
                );
                $cmd = "cp -R $srcpath/* $destpath";
                $this->exec($cmd, $output, $bgOutputFilename);
                $this->finalizeBgProcStatus($bgStatusFilename, $output);

            } catch(Exception $e) {
                $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
                exit(1);
            }
        } else {
            OMVModuleDockerUtil::startDockerService();
            throw new OMVModuleDockerException(
                "Not a valid Docker source path specified"
            );
        }
        OMVModuleDockerUtil::startDockerService();
    }

    /**
     * Execute command inside running Docker container
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return void
     */
    public function executeCommand($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array("role" => OMV_ROLE_ADMINISTRATOR)
        );
        $this->validateMethodParams(
            $params, 
            '{' .
            '"type": "object",' .
            '"properties": {' .
            '"cmd": { "type" : "string" },' .
            '"containerId": { "type" : "string" }' .
            '}}'
        );

        // Create a background process.
        $bgStatusFilename = $this->createBgProcStatus();
        $pid = $this->fork();
        if ($pid > 0) {
            $this->initializeBgProcStatus($bgStatusFilename, $pid);
            return $bgStatusFilename;
        }

        // Child process.
        try {
            $bgOutputFilename = $this->createBgProcOutput();
            $this->updateBgProcStatus(
                $bgStatusFilename,
                "outputfilename",
                $bgOutputFilename
            );
            $cmd = "docker exec -t " . $params['containerId'] . " " .
                $params['cmd'];
            $this->exec($cmd, $output, $bgOutputFilename);
            $this->finalizeBgProcStatus($bgStatusFilename, $output);

        } catch(Exception $e) {
            $this->finalizeBgProcStatus($bgStatusFilename, "", $e);
            exit(1);
        }
    }

    /**
     * Retrieve list of Docker repos from Github source
     * 
     * @param array  $params  An associative array with all RPC call parameters
     * @param string $context The context of the user maing the RPC call
     *
     * @return array $objects An associative array with all repos
     */
    public function getDockerRepo($params, $context)
    {
        $this->validateMethodContext(
            $context,
            array( "role" => OMV_ROLE_ADMINISTRATOR )
        );
        $logoPath = "/var/www/openmediavault/images/dockerrepo/";
        $baseUrl = "http://openmediavault-plugin-developers.github.io/" . 
            "openmediavault-docker-repo/";
        $imgBase = $baseUrl . "logos/";
        $repoUrl = $baseUrl . "dockerlist.xml";

        $cmd = "mkdir -p $logoPath";
        OMVUtil::exec($cmd, $out, $res);

        $data = file_get_contents($repoUrl);
        $xml = simplexml_load_string($data);
        $objects = array();
        foreach ($xml as $image) {
            //Use blank logo if no imageurl is specified
            if (strlen($image->imageurl) === 0) {
                $logo = "";
            } else {
                $logo = $image->imageurl;
                copy($imgBase . $image->imageurl, $logoPath . $image->imageurl);
            }
            //Silently skip any records that are missing data
            if ((strlen($image->name) === 0) || (strlen($image->desc) === 0) || (strlen($image->category) === 0) || (strlen($image->repo) === 0)) {
                continue;
            } else {
                $temp = array("name" => $image->name,
                    "category" => $image->category,
                    "logo" => $logo,
                    "desc" => $image->desc,
                    "repo" => $image->repo);
                array_push($objects, $temp);
            }
        }
        return $objects;
    }

    //throw new OMVModuleDockerException($cmd);
}

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance();
$rpcServiceMgr->registerService(new OMVRpcServiceDocker());
