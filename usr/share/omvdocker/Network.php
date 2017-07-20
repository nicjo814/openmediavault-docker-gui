<?php
/**
 * Copyright (c) 2015-2017 OpenMediaVault Plugin Developers
 *
 * @category OMVModuleDockerNetwork
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
 * OMVModuleDockerNetwork class
 *
 * @category Class
 * @package  Openmediavault-docker-gui
 * @author   OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://github.com/OpenMediaVault-Plugin-Developers/openmediavault-docker-gui
 *
 */
class OMVModuleDockerNetwork
{
    /**
     * Id of the network
     *
     * @var    string $_id
     * @access private
     */
    private $_id;

    /**
     * Name of the network
     *
     * @var    string $_name
     * @access private
     */
    private $_name;

    /**
     * Driver of the network
     *
     * @var    string $_driver
     * @access private
     */
    private $_driver;

    /**
     * Scope of the network
     *
     * @var    string $_scope
     * @access private
     */
    private $_scope;

    /**
     * Constructor. The network will be updated with all associated properties
     * from commandline.
     *
     * @param string $id      Id of the new network
     * @param array  $data    Associative array with Network data
     * @param int    $apiPort Network port used by API calls
     */
    public function __construct($id, $data, $apiPort)
    {
        $this->_id = $id;
        $item = $data[substr($id, 0, 12)];

        $this->_name = $item->name;
        $this->_driver = $item->driver;
        $this->_scope = $item->scope;
    }

    /**
     * Return id of the network
     *
     * @return string $id
     * @access public
     */
    public function getId()
    {
        return (substr($this->_id, 0, 12));
    }

    /**
     * Get the name of the network
     *
     * @return string $_name
     * @access public
     */
    public function getName()
    {
        return $this->_name;
    }

    /**
     * Get the driver of the network
     *
     * @return string $_driver
     * @access public
     */
    public function getDriver()
    {
        return $this->_driver;
    }

    /**
     * Get the scope of the network
     *
     * @return string $_scope
     * @access public
     */
    public function getScope()
    {
        return $this->_scope;
    }

}
