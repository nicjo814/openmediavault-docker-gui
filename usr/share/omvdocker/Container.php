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

require_once("Exception.php");

/**
 * XXX detailed description
 *
 * @author    XXX
 * @version   XXX
 * @copyright XXX
 */
class OMVModuleDockerContainer {
    // Attributes

    /**
     * Name of container image
     *
     * @var    string $image
     * @access private
     */
    private $image;

    /**
     * Id of the conatiner
     *
     * @var    string $id
     * @access private
     */
    private $id;

    /**
     * Time when container was created
     *
     * @var 	string $created
     * @access private
     */
    private $created;

    /**
     * Command that is started by the container
     *
     * @var 	string $command
     * @access private
     */
    private $command;

    /**
     * Status of the container
     *
     * @var 	string $status
     * @access private
     */
    private $status;

    /**
     * State of the container
     *
     * @var 	string $state
     * @access private
     */
    private $state;

    /**
     * Ports mapped to the container
     *
     * @var 	array $ports
     * @access private
     */
    private $ports;

    /**
     * Network mode of the container
     *
     * @var 	string $networkMode
     * @access private
     */
    private $networkMode;

    /**
     * Privileged mode of the container
     *
     * @var 	bool $privileged
     * @access private
     */
    private $privileged;

    /**
     * Restart policy of the container
     *
     * @var 	string $restartPolicy
     * @access private
     */
    private $restartPolicy;

    /**
     * Environment variables defined in the container
     *
     * @var 	array $envVars
     * @access private
     */
    private $envVars;

    /**
     * ID of the image the container is created from
     *
     * @var 	string $imageId
     * @access private
     */
    private $imageId;

    /**
     * Port bindings in the container
     *
     * @var 	array $portBindings
     * @access private
     */
    private $portBindings;

    /**
     * Bind mounts in the container
     *
     * @var 	array $bindMounts
     * @access private
     */
    private $bindMounts;

    /**
     * Name of the container
     *
     * @var 	string $names
     * @access private
     */
    private $names;

    // Associations
    // Operations

    /**
     * Constructor. The container will be updated with all associated properties from commandline.
     *
     * @param string $id Id of the new image
     * @return void
     * @access public
     */
    public function __construct($id, $data, $apiPort) {
        $this->id = $id;
        $now = date("c");

        $this->id = $id;
        $item = $data[substr($id, 0, 12)];
        $this->image = $item->Image;
        $this->status = $item->Status;
        $this->command = $item->Command;
        $this->created = OMVModuleDockerUtil::getWhen($now, date("c", $item->Created)) . " ago";

        $url = "http://localhost:" . $apiPort . "/containers/$id/json";
        $response = OMVModuleDockerUtil::doApiCall($url);
        $containerData = json_decode($response);
        if($containerData->State->Running) {
            $this->state = "running";
        } elseif (($containerData->State->Dead) || ($containerData->State->ExitCode !== 0)) {
            $this->state = "dead";
        } elseif (($containerData->State->ExitCode === 0) && (strcmp($containerData->State->Error, "") === 0)) {
            $this->state = "stopped";
        }
        $this->ports = array();
        foreach($containerData->NetworkSettings->Ports as $exposedport => $hostports) {
            if($hostports) {
                $this->ports[$exposedport] = array();
                foreach($hostports as $hostport) {
                    $tmparray = array(
                        "HostIp" => $hostport->HostIp,
                        "HostPort" => $hostport->HostPort);
                    array_push($this->ports[$exposedport], $tmparray);
                }
            } else {
                $this->ports[$exposedport] = NULL;
            }
        }
        $this->networkMode = $containerData->HostConfig->NetworkMode;
        $this->privileged = $containerData->HostConfig->Privileged;
        $this->restartPolicy = $containerData->HostConfig->RestartPolicy->Name;
        $this->envVars = array();
        if(is_array($containerData->Config->Env)) {
            foreach($containerData->Config->Env as $eVar) {
                $eVarAry = explode("=", $eVar);
                $this->envVars[$eVarAry[0]] = $eVarAry[1];
            }
        }
        $this->imageId = $containerData->Image;
        $this->portBindings = array();
        foreach($containerData->HostConfig->PortBindings as $containerPort => $mappings) {
            foreach($mappings as $mapping) {
                array_push($this->portBindings, array(
                    "containerportstring" => $containerPort,
                    "containerportnr" => preg_split('/\//', $containerPort)[0],
                    "hostip" => $mapping->HostIp,
                    "hostport" => $mapping->HostPort
                ));
            }
        }
        $this->bindMounts = array();
        foreach($containerData->HostConfig->Binds as $bind) {
            array_push($this->bindMounts, array("from" => preg_split('/\:/',$bind)[0],
                "to" => preg_split('/\:/', $bind)[1]));
        }

        $this->names = ltrim($item->Names[0], "/");
    }

    /**
     * Return id of the container
     *
     * @return string $id
     * @access public
     */
    public function getId() {
        return substr($this->id, 0, 12);
    }

    /**
     * Get the image the conatiner is mapped to
     *
     * @return string $image
     * @access public
     */
    public function getImage() {
        return $this->image;
    }

    /**
     * Get the status of the container
     *
     * @return string $status
     * @access public
     */
    public function getStatus() {
        return $this->status;
    }

    /**
     * Get the creation time of the conatiner
     *
     * @return string $created
     * @access public
     */
    public function getCreated() {
        return $this->created;
    }

    /**
     * Get the init command of the container
     *
     * @return string $command
     * @access public
     */
    public function getCommand() {
        return $this->command;
    }

    /**
     * Get the state of the container
     *
     * @return string $state
     * @access public
     */
    public function getState() {
        return $this->state;
    }

    /**
     * Get the port mappings of the container
     *
     * @return array $ports
     * @access public
     */
    public function getPorts() {
        return $this->ports;
    }

    /**
     * Get the network mode of the contanier
     *
     * @return string $networkMode
     * @access public
     */
    public function getNetworkMode() {
        return $this->networkMode;
    }

    /**
     * Get the privileged mode of the container
     *
     * @return bool $privileged
     * @access public
     */
    public function getPrivileged() {
        return $this->privileged;
    }

    /**
     * Get the restart policy of the container
     *
     * @return string $restartPolicy
     * @access public
     */
    public function getRestartPolicy() {
        return $this->restartPolicy;
    }

    /**
     * Get the environment variables defined in the container
     *
     * @return array $envVars
     * @access public
     */
    public function getEnvironmentVariables() {
        return $this->envVars;
    }

    /**
     * Get the image id of the image used to create the container
     *
     * @return string $imageId
     * @access public
     */
    public function getImageId() {
        return $this->imageId;
    }

    /**
     * Get the port bindings of the container
     *
     * @return array $portBindings
     * @access public
     */
    public function getPortBindings() {
        return $this->portBindings;
    }

    /**
     * Get the bind mounts in the container
     *
     * @return array $bindMounts
     * @access public
     */
    public function getBindMounts() {
        return $this->bindMounts;
    }

    /**
     * Get the name of the container
     *
     * @return string $names
     * @access public
     */
    public function getName() {
        return $this->names;
    }

}
