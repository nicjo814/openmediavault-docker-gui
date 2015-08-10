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
	public function __construct($id) {
		$this->id = $id;
		$now = date("c");
		$cmd = "docker inspect --format='{{json .}}' " . $id . " 2>&1";
		OMVModuleDockerUtil::exec($cmd,$output,$res);
		if(is_array($output) && !preg_match('/^Error.*$/', $output[0])) {
			$containerData = json_decode($output[0]);
			$this->id = $id;
			$this->image = $containerData->Config->Image;
			if(is_array($containerData->Config->Cmd)) {
				$this->command = $containerData->Config->Cmd[0];
			}
			$this->created = OMVModuleDockerUtil::getWhen($now, $containerData->Created) . " ago";
			if($containerData->State->Running) {
				$this->status = "Up " . OMVModuleDockerUtil::getWhen($now, $containerData->State->StartedAt);
				$this->state = "running";
			} elseif ($containerData->State->Dead) {
				$this->state = "dead";
			} elseif (($containerData->State->ExitCode === 0) && (strcmp($containerData->State->Error, "") === 0)) {
				$this->status = "Exited (0) " . OMVModuleDockerUtil::getWhen($now, $containerData->State->FinishedAt) . " ago";
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
			$this->names = ltrim($containerData->Name, "/");
		}
	}

	/**
	 * Return id of the container
	 *
	 * @return string $id
	 * @access public
	 */
	public function getId() {
		return $this->id;
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
	 * Get the name of the container
	 * 
	 * @return string $names
	 * @access public
	 */
	public function getName() {
		return $this->names;
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

}

?>
