<?php
/**
 * Copyright (c) 2015-2017 OpenMediaVault Plugin Developers
 *
 * @category OMVModuleDockerImage
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
 * OMVModuleDockerImage class
 *
 * @category Class
 * @package  Openmediavault-docker-gui
 * @author   OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://github.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-gui
 *
 */
class OMVModuleDockerImage
{
    /**
     * Name of image repository
     *
     * @var    string $_repository
     * @access private
     */
    private $_repository;

    /**
     * Tag of the image
     *
     * @var    string $_tag
     * @access private
     */
    private $_tag;

    /**
     * Id of the image
     *
     * @var    string $_id
     * @access private
     */
    private $_id;

    /**
     * Time when image was created
     *
     * @var 	string $_created
     * @access private
     */
    private $_created;

    /**
     * Timestamp when image was created
     *
     * @var 	string $_timestamp
     * @access private
     */
    private $_timestamp;

    /**
     * Virtual size of the image
     *
     * @var 	string $_size
     * @access private
     */
    private $_size;

    /**
     * Exposed ports of the image
     *
     * @var 	array $_ports
     * @access private
     */
    private $_ports;

    /**
     * Environment variables defined in the image
     *
     * @var 	array $_envVars
     * @access private
     */
    private $_envVars;

    /**
     * Volumes defined in the image
     *
     * @var 	array $_volumes
     * @access private
     */
    private $_volumes;

    /**
     * Constructor. The image will be updated with all associated properties
     * from commandline.
     *
     * @param string $id      Id of the new container
     * @param array  $data    Associative array with Image data
     * @param int    $apiPort Network port used by API calls
     */
    public function __construct($id, $data, $apiPort)
    {
        $now = date("c");
        $this->_id = $id;
        $item = $data[substr($id, 0, 12)];

        if (isset($item->RepoTags)) {
            $this->_repository = preg_split('/\:/', $item->RepoTags[0])[0];
            $this->_tag = preg_split('/\:/', $item->RepoTags[0])[1];
        } else {
            $this->_repository = "none";
            $this->_tag = "none";
        }
        $this->_created = OMVModuleDockerUtil::getWhen(
            $now,
            date("c", $item->Created)
        ) . " ago";
        $this->_size = OMVModuleDockerUtil::bytesToSize($item->VirtualSize);

        $url = "http://localhost:" . $apiPort . "/images/$id/json";
        $response = OMVModuleDockerUtil::doApiCall($url);

        $imageData = json_decode($response);
        $this->_timestamp = date("U", $item->Created);
        $this->_ports = array();
        if (isset($imageData->Config->ExposedPorts)) {
            foreach ($imageData->Config->ExposedPorts as
                $exposedport => $hostports) {
                array_push($this->_ports, array("name" => $exposedport));
            }
        }
        $this->_envVars = array();
        if (isset($imageData->Config->Env)) {
            foreach ($imageData->Config->Env as $eVar) {
                $eVarAry = explode("=", $eVar);
                $this->_envVars[$eVarAry[0]] = $eVarAry[1];
            }
        }
        $this->_volumes = array();
        if (isset($imageData->Config->Volumes)) {
            foreach ($imageData->Config->Volumes as $key => $val) {
                array_push($this->_volumes, array($key));
            }
        }

    }

    /**
     * Return id of the image
     *
     * @return string $id
     * @access public
     */
    public function getId()
    {
        return (substr($this->_id, 0, 12));
    }

    /**
     * Get the repository of the image
     *
     * @return string $_repository
     * @access public
     */
    public function getRepository()
    {
        return $this->_repository;
    }

    /**
     * Get the tag of the image
     *
     * @return string $_tag
     * @access public
     */
    public function getTag()
    {
        return $this->_tag;
    }

    /**
     * Get the creation time of the image
     *
     * @return string $_created
     * @access public
     */
    public function getCreated()
    {
        return $this->_created;
    }

    /**
     * Get the virtual size of the image
     *
     * @return string $_size
     * @access public
     */
    public function getSize()
    {
        return $this->_size;
    }

    /**
     * Get the ports exposed by the image
     *
     * @return array $_ports
     * @access public
     */
    public function getPorts()
    {
        return $this->_ports;
    }

    /**
     * Get the environment variables exposed by the image
     *
     * @return array $_envVars
     * @access public
     */
    public function getEnvVars()
    {
        return $this->_envVars;
    }

    /**
     * Get the volumes exposed by the image
     *
     * @return array $_volumes
     * @access public
     */
    public function getVolumes()
    {
        return $this->_volumes;
    }

    /**
     * Get the timestamp when the image was created
     *
     * @return array $_timestamp
     * @access public
     */
    public function getTimestamp()
    {
        return $this->_timestamp;
    }

}
