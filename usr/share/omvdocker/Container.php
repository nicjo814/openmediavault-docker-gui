<?php
/**
 * Copyright (c) 2015 OpenMediaVault Plugin Developers
 *
 * @category OMVModuleDockerContainer
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

require_once "Exception.php";

/**
 * Class for managing Docker containers
 *
 * @category Class
 * @package  Openmediavault-docker-gui
 * @author   OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://github.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-gui
 *
 */

class OMVModuleDockerContainer
{
    // Attributes

    /**
     * Name of container image
     *
     * @var    string $_image
     * @access private
     */
    private $_image;

    /**
     * Id of the conatiner
     *
     * @var    string $_id
     * @access private
     */
    private $_id;

    /**
     * Time when container was created
     *
     * @var 	string $_created
     * @access private
     */
    private $_created;

    /**
     * Command that is started by the container
     *
     * @var 	string $_command
     * @access private
     */
    private $_command;

    /**
     * Status of the container
     *
     * @var 	string $_status
     * @access private
     */
    private $_status;

    /**
     * State of the container
     *
     * @var 	string $_state
     * @access private
     */
    private $_state;

    /**
     * Ports mapped to the container
     *
     * @var 	array $_ports
     * @access private
     */
    private $_ports;

    /**
     * Network mode of the container
     *
     * @var 	string $_networkMode
     * @access private
     */
    private $_networkMode;

    /**
     * Privileged mode of the container
     *
     * @var 	bool $_privileged
     * @access private
     */
    private $_privileged;

    /**
     * Restart policy of the container
     *
     * @var 	string $_restartPolicy
     * @access private
     */
    private $_restartPolicy;

    /**
     * Environment variables defined in the container
     *
     * @var 	array $_envVars
     * @access private
     */
    private $_envVars;

    /**
     * ID of the image the container is created from
     *
     * @var 	string $_imageId
     * @access private
     */
    private $_imageId;

    /**
     * Port bindings in the container
     *
     * @var 	array $_portBindings
     * @access private
     */
    private $_portBindings;

    /**
     * Bind mounts in the container
     *
     * @var 	array $_bindMounts
     * @access private
     */
    private $_bindMounts;

    /**
     * Name of the container
     *
     * @var 	string $_names
     * @access private
     */
    private $_names;

    // Associations
    // Operations

    /**
     * Constructor. The container will be updated with all associated
     * properties from commandline.
     *
     * @param string $id      Id of the new image
     * @param array  $data    An associative array with all containers
     * @param imt    $apiPort An associative array with all containers
     *
     * @return void
     * @access public
     */
    public function __construct($id, $data, $apiPort)
    {
        $this->_id = $id;
        $now = date("c");
        $item = $data[substr($id, 0, 12)];
        $this->_image = $item->Image;
        $this->_status = $item->Status;
        $this->_command = $item->Command;
        $this->_created = OMVModuleDockerUtil::getWhen(
            $now,
            date("c", $item->Created)
        ) . " ago";

        $url = "http://localhost:" . $apiPort . "/containers/$id/json";
        $response = OMVModuleDockerUtil::doApiCall($url);
        $containerData = json_decode($response);
        if ($containerData->State->Running) {
            $this->_state = "running";
        } elseif (($containerData->State->Dead) || ($containerData->State->ExitCode !== 0)) {
            $this->_state = "dead";
        } elseif (($containerData->State->ExitCode === 0) && (strcmp($containerData->State->Error, "") === 0)) {
            $this->_state = "stopped";
        }
        $this->_ports = array();
        foreach ($containerData->NetworkSettings->Ports as $exposedport => $hostports) {
            if ($hostports) {
                $this->_ports[$exposedport] = array();
                foreach ($hostports as $hostport) {
                    $tmparray = array(
                        "HostIp" => $hostport->HostIp,
                        "HostPort" => $hostport->HostPort);
                    array_push($this->_ports[$exposedport], $tmparray);
                }
            } else {
                $this->_ports[$exposedport] = null;
            }
        }
        $this->_networkMode = $containerData->HostConfig->NetworkMode;
        $this->_privileged = $containerData->HostConfig->Privileged;
        $this->_restartPolicy = $containerData->HostConfig->RestartPolicy->Name;
        $this->_envVars = array();
        if (is_array($containerData->Config->Env)) {
            foreach ($containerData->Config->Env as $eVar) {
                $eVarAry = explode("=", $eVar);
                $this->_envVars[$eVarAry[0]] = $eVarAry[1];
            }
        }
        $this->_imageId = $containerData->Image;
        $this->_portBindings = array();
        foreach ($containerData->HostConfig->PortBindings as $containerPort => $mappings) {
            foreach ($mappings as $mapping) {
                array_push(
                    $this->_portBindings,
                    array(
                        "containerportstring" => $containerPort,
                        "containerportnr" => preg_split('/\//', $containerPort)[0],
                        "hostip" => $mapping->HostIp,
                        "hostport" => $mapping->HostPort
                    )
                );
            }
        }
        $this->_bindMounts = array();
        foreach ($containerData->HostConfig->Binds as $bind) {
            array_push(
                $this->_bindMounts,
                array("from" => preg_split('/\:/', $bind)[0],
                "to" => preg_split('/\:/', $bind)[1])
            );
        }

        $this->_names = ltrim($item->Names[0], "/");
    }

    /**
     * Return id of the container
     *
     * @return string $id
     * @access public
     */
    public function getId()
    {
        return substr($this->_id, 0, 12);
    }

    /**
     * Get the image the conatiner is mapped to
     *
     * @return string $image
     * @access public
     */
    public function getImage()
    {
        return $this->_image;
    }

    /**
     * Get the status of the container
     *
     * @return string $status
     * @access public
     */
    public function getStatus()
    {
        return $this->_status;
    }

    /**
     * Get the creation time of the conatiner
     *
     * @return string $created
     * @access public
     */
    public function getCreated()
    {
        return $this->_created;
    }

    /**
     * Get the init command of the container
     *
     * @return string $command
     * @access public
     */
    public function getCommand()
    {
        return $this->_command;
    }

    /**
     * Get the state of the container
     *
     * @return string $state
     * @access public
     */
    public function getState()
    {
        return $this->_state;
    }

    /**
     * Get the port mappings of the container
     *
     * @return array $ports
     * @access public
     */
    public function getPorts()
    {
        return $this->_ports;
    }

    /**
     * Get the network mode of the contanier
     *
     * @return string $networkMode
     * @access public
     */
    public function getNetworkMode()
    {
        return $this->_networkMode;
    }

    /**
     * Get the privileged mode of the container
     *
     * @return bool $privileged
     * @access public
     */
    public function getPrivileged()
    {
        return $this->_privileged;
    }

    /**
     * Get the restart policy of the container
     *
     * @return string $restartPolicy
     * @access public
     */
    public function getRestartPolicy()
    {
        return $this->_restartPolicy;
    }

    /**
     * Get the environment variables defined in the container
     *
     * @return array $envVars
     * @access public
     */
    public function getEnvironmentVariables()
    {
        return $this->_envVars;
    }

    /**
     * Get the image id of the image used to create the container
     *
     * @return string $imageId
     * @access public
     */
    public function getImageId()
    {
        return $this->_imageId;
    }

    /**
     * Get the port bindings of the container
     *
     * @return array $portBindings
     * @access public
     */
    public function getPortBindings()
    {
        return $this->_portBindings;
    }

    /**
     * Get the bind mounts in the container
     *
     * @return array $bindMounts
     * @access public
     */
    public function getBindMounts()
    {
        return $this->_bindMounts;
    }

    /**
     * Get the name of the container
     *
     * @return string $names
     * @access public
     */
    public function getName()
    {
        return $this->_names;
    }
}
