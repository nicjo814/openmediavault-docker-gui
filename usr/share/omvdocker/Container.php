<?php
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
		$curl = curl_init();
		curl_setopt_array($curl, array(
			CURLOPT_RETURNTRANSFER => 1,
			CURLOPT_TIMEOUT => 30,
			CURLOPT_CONNECTTIMEOUT => 5
		));

		$this->id = $id;
		$item = $data[substr($id, 0, 12)];
		$this->image = $item->Image;
		$this->status = $item->Status;
		$this->command = $item->Command;
		$this->created = OMVModuleDockerUtil::getWhen($now, date("c", $item->Created)) . " ago";
		
		$url = "http://localhost:" . $apiPort . "/containers/$id/json"; 
		curl_setopt($curl, CURLOPT_URL, $url);
		if(!($response = curl_exec($curl))){
			throw new OMVModuleDockerException('Error: "' . curl_error($curl) . '" - Code: ' . curl_errno($curl));
		}
		$containerData = json_decode($response);
		if($containerData->State->Running) {
			$this->state = "running";
		} elseif ($containerData->State->Dead) {
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
	 * Get the name of the container
	 * 
	 * @return string $names
	 * @access public
	 */
	public function getName() {
		return $this->names;
	}

}

?>
