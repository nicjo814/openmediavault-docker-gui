<?php
require_once("Exception.php");

/**
 * XXX detailed description
 *
 * @author    XXX
 * @version   XXX
 * @copyright XXX
 */
class OMVModuleDockerImage {
	// Attributes

    /**
     * Name of image repository
     *
     * @var    string $repository
     * @access private
     */
    private $repository;
	
	/**
     * Tag of the image
     *
     * @var    string $tag
     * @access private
     */
    private $tag;

    /**
     * Id of the image
     *
     * @var    string $id
     * @access private
     */
    private $id;

	/**
	 * Time when image was created
	 *
	 * @var 	string $created
	 * @access private
	 */
	private $created;

	/**
	 * Virtual size of the image
	 *
	 * @var 	string $size
	 * @access private
	 */
	private $size;

	/**
	 * Exposed ports of the image
	 *
	 * @var 	array $ports
	 * @access private
	 */
	private $ports;

	/**
	 * Environment variables defined in the image
	 *
	 * @var 	array $envVars
	 * @access private
	 */
	private $envVars;

	// Associations
	// Operations

	/**
	 * Constructor. The image will be updated with all associated properties from commandline.
	 *
	 * @param string $id Id of the new container
	 * @return void
	 * @access public
	 */
	public function __construct($id, $data, $apiPort) {
		$now = date("c");
		$curl = curl_init();
		curl_setopt_array($curl, array(
			CURLOPT_RETURNTRANSFER => 1,
			CURLOPT_TIMEOUT => 30,
			CURLOPT_CONNECTTIMEOUT => 5
		));

		$this->id = $id;
		$item = $data[substr($id, 0, 12)];

		if(is_array($item->RepoTags) && (count($item->RepoTags) > 0)) {
			$this->repository = preg_split('/\:/',$item->RepoTags[0])[0];
			$this->tag = preg_split('/\:/',$item->RepoTags[0])[1];
		} else {
			$this->repository = "none";
			$this->tag = "none";
		}
		$this->created = OMVModuleDockerUtil::getWhen($now, date("c", $item->Created)) . " ago";
		$this->size = OMVModuleDockerUtil::bytesToSize($item->VirtualSize);

		$url = "http://localhost:" . $apiPort . "/images/$id/json";
		curl_setopt($curl, CURLOPT_URL, $url);
		if(!($response = curl_exec($curl))){
			throw new OMVModuleDockerException('Error: "' . curl_error($curl) . '" - Code: ' . curl_errno($curl));
		}
		$imageData = json_decode($response);
		$this->ports = array();
		foreach($imageData->Config->ExposedPorts as $exposedport => $hostports) {
			array_push($this->ports, array("name" => $exposedport));
		}
		$this->envVars = array();
		if(is_array($imageData->Config->Env)) {
			foreach($imageData->Config->Env as $eVar) {
				$eVarAry = explode("=", $eVar); 
				$this->envVars[$eVarAry[0]] = $eVarAry[1];
			}
		}
		curl_close($curl);
	}

	/**
	 * Return id of the image
	 *
	 * @return string $id
	 * @access public
	 */
	public function getId() {
		return (substr($this->id, 0, 12));
	}

	/**
	 * Get the repository of the image
	 *
	 * @return string $repository
	 * @access public
	 */
	public function getRepository() {
		return $this->repository;
	}

	/**
	 * Get the tag of the image
	 *
	 * @return string $tag
	 * @access public
	 */
	public function getTag() {
		return $this->tag;
	}

	/**
	 * Get the creation time of the image
	 * 
	 * @return string $created
	 * @access public
	 */
	public function getCreated() {
		return $this->created;
	}

	/**
	 * Get the virtual size of the image
	 * 
	 * @return string $size
	 * @access public
	 */
	public function getSize() {
		return $this->size;
	}

	/**
	 * Get the ports exposed by the image
	 * 
	 * @return array $ports
	 * @access public
	 */
	public function getPorts() {
		return $this->ports;
	}

	/**
	 * Get the environment variables exposed by the image
	 * 
	 * @return array $envVars
	 * @access public
	 */
	public function getEnvVars() {
		return $this->envVars;
	}
}

?>
