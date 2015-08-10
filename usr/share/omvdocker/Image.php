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

	// Associations
	// Operations

	/**
	 * Constructor. The image will be updated with all associated properties from commandline.
	 *
	 * @param string $id Id of the new container
	 * @return void
	 * @access public
	 */
	public function __construct($id) {
		$this->id = $id;
		$now = date("c");
		$cmd = "docker images | grep $id 2>&1";
		OMVModuleDockerUtil::exec($cmd, $out, $res);
		if(preg_match('/^(\S+)\s+(\S+)\s+.*$/',$out[0],$matches)) {
			$this->repository=$matches[1];
			$this->tag=$matches[2];
		}
		unset($out);
		$cmd = "docker inspect --format='{{json .}}' $id";
		OMVModuleDockerUtil::exec($cmd, $out, $res);
		$imageData = json_decode($out[0]);
		$this->created = OMVModuleDockerUtil::getWhen($now, $imageData->Created) . " ago";
		$this->size = OMVModuleDockerUtil::bytesToSize($imageData->VirtualSize);
		$this->ports = array();
		foreach($imageData->Config->ExposedPorts as $exposedport => $hostports) {
			array_push($this->ports, array("name" => $exposedport));
		}
	}

	/**
	 * Return id of the image
	 *
	 * @return string $id
	 * @access public
	 */
	public function getId() {
		return $this->id;
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
}

?>
