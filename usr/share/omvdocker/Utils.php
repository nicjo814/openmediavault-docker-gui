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
require_once("openmediavault/util.inc");
require_once("Image.php");
require_once("Container.php");


/**
 * Helper class for Docker module
 */
class OMVModuleDockerUtil
{

    /**
     * Returns the result of a call to the Docker API
     *
     * @param string $url The URL to use in the API call
     * @return array $objects An array with Image objects
     *
     */
    public static function doApiCall($url)
    {
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 5
        ));
        curl_setopt($curl, CURLOPT_URL, $url);
        if (!($response = curl_exec($curl))){
            throw new OMVModuleDockerException(
                'Error: "' . curl_error($curl) . '" - Code: ' .
                curl_errno($curl));
        }
        curl_close($curl);
        return $response;
    }

    /**
     * Stops the Docker service
     *
     */
    public static function stopDockerService()
    {
        $cmd = 'ps aux | grep "/usr/bin/docker daemon" | grep -v grep | wc -l';
        OMVUtil::exec($cmd, $out, $res);
        if ($out[0] === "1") {
            unset($out);
            $cmd = "docker ps -q | wc -l";
            OMVUtil::exec($cmd, $out, $res);
            if ($out[0] > 0) {
                unset($out);
                //Kill any running Docker containers
                $cmd = "docker ps -q | xargs docker kill";
                OMVUtil::exec($cmd, $out, $res);
            }
            //Stop the Docker daemon before making config changes
            $cmd = "service docker stop";
            OMVUtil::exec($cmd, $out, $res);
        }
    }

    /**
     * Starts the Docker service
     *
     */
    public static function startDockerService()
    {
        //Start the daemon again after changes have been made
        $cmd = "service docker start";
        OMVUtil::exec($cmd, $out, $res);
        unset($out);
        $cmd = 'ps aux | grep "/usr/bin/docker daemon" | grep -v grep | wc -l';
        OMVUtil::exec($cmd, $out, $res);
        if ($out[0] === "0") {
            for ($i = 0; $i < 5; $i++) {
                unset($out);
                $cmd = "service docker start";
                OMVUtil::exec($cmd, $out, $res);
                unset($out);
                $cmd = 'ps aux | grep "/usr/bin/docker daemon" | ' .
                    'grep -v grep | wc -l';
                OMVUtil::exec($cmd, $out, $res);
                if ($out[0] === "1") {
                    break;
                }
            }
        }
    }

    /**
     * Returns an array with Image objects on the system
     *
     * @return array $objects An array with Image objects
     *
     */
    public static function getImages($apiPort, $incDangling)
    {
        $objects=array();
        $url = "http://localhost:" . $apiPort . "/images/json?all=0";
        /*
        if ($incDangling) {
        $url .= "0";
        } else {
        $url .= "1";
        }
         */
        $response = OMVModuleDockerUtil::doApiCall($url);
        $data = array();
        foreach (json_decode($response) as $item) {
            $data[substr($item->Id, 0, 12)] = $item;
        }
        foreach ($data as $item) {
            $image = new OMVModuleDockerImage($item->Id, $data, $apiPort);
            $tmp=array(
                "repository"=>rtrim(ltrim($image->getRepository(), "<"), ">"),
                "tag"=>rtrim(ltrim($image->getTag(), "<"), ">"),
                "id"=>$image->getId(),
                "created"=>$image->getCreated(),
                "size"=>$image->getSize(),
                "ports"=>$image->getPorts(),
                "envvars"=>$image->getEnvVars());
            array_push($objects, $tmp);
        }
        return $objects;
    }

    /**
     * Returns a single image from it's ID
     *
     * @return OMVModuleDockerImage $image A single Docker image
     *
     */
    public static function getImage($id, $apiPort)
    {
        $objects = array();
        $url = "http://localhost:" . $apiPort . "/images/json?all=1";
        $response = OMVModuleDockerUtil::doApiCall($url);
        $data = array();
        foreach (json_decode($response) as $item) {
            $data[substr($item->Id, 0, 12)] = $item;
        }
        return (new OMVModuleDockerImage($data[$id]->Id, $data, $apiPort));
    }


    /**
     * Returns an array with Container objects on the system
     *
     * @return array $objects An array with Container objects
     *
     */
    public static function getContainers($apiPort)
    {
        $objects = array();
        $url = "http://localhost:" . $apiPort . "/containers/json?all=1";
        $response = OMVModuleDockerUtil::doApiCall($url);
        $data = array();
        foreach (json_decode($response) as $item) {
            $data[substr($item->Id, 0, 12)] = $item;
        }
        foreach ($data as $item) {
            $container = new OMVModuleDockerContainer(
                $item->Id,
                $data,
                $apiPort);
            $ports = "";
            foreach ($container->getPorts() as $exposedport => $hostports) {
                if ($hostports) {
                    foreach ($hostports as $hostport) {
                        $ports .= $hostport["HostIp"] . ":" .
                            $hostport["HostPort"] .
                            "->" . $exposedport . ", ";
                    }
                } else {
                    $ports .= $exposedport . ", ";
                }
            }
            $image = OMVModuleDockerUtil::getImage(
                substr($container->getImageId(), 0, 12),
                $apiPort);
            $exposedPorts = $image->getPorts();
            $envvars = $image->getEnvVars();
            $ports = rtrim($ports, ", ");
            $obj = array(
                "id" => $container->getId(),
                "image" => $container->getImage(),
                "command" => $container->getCommand(),
                "created" => $container->getCreated(),
                "state" => $container->getState(),
                "status" => $container->getStatus(),
                "name" => $container->getName(),
                "privileged" => $container->getPrivileged(),
                "restartpolicy" => $container->getRestartPolicy(),
                "networkmode" => ucfirst($container->getNetworkMode()),
                "envvars" => $envvars,
                "cenvvars" => $container->getEnvironmentVariables(),
                "exposedports" => $exposedPorts,
                "portbindings" => $container->getPortBindings(),
                "bindmounts" => $container->getBindMounts(),
                "ports" => $ports);
            array_push($objects, $obj);
        }
        return $objects;
    }

    /**
     * Returns a single container from it's ID
     *
     * @return OMVModuleDockerContainer $container A single container object
     *
     */
    public static function getContainer($id, $apiPort)
    {
        $objects = array();
        $url = "http://localhost:" . $apiPort . "/containers/json?all=1";
        $response = OMVModuleDockerUtil::doApiCall($url);
        $data = array();
        foreach (json_decode($response) as $item) {
            $data[substr($item->Id, 0, 12)] = $item;
        }
        return (new OMVModuleDockerContainer($data[$id]->Id, $data, $apiPort));
    }

    /**
     * Returns a string representing a time sometime in the past
     *
     * @return string $when A string representaion of a past time
     *
     */
    public static function getWhen($now, $eventTime)
    {
        $when = "";
        $diff = date_diff(new DateTime($now),new DateTime($eventTime));
        if ($diff->y > 0) {
            $when = "$diff->y years";
        } elseif ($diff->m > 0) {
            $when = "$diff->m months";
        } elseif ($diff->d > 0) {
            $when = "$diff->d days";
        } elseif ($diff->h > 0) {
            $when = "$diff->h hours";
        } elseif ($diff->i > 0) {
            $when = "$diff->i minutes";
        } elseif ($diff->s > 0) {
            $when = "$diff->s seconds";
        } else {
            $when = "Less than a second";
        }
        return $when;
    }

    /**
     * Convert bytes to human readable format
     *
     * @param integer bytes Size in bytes to convert
     * @return string
     */
    function bytesToSize($bytes, $precision =1)
    {
        /*
        $kilobyte = 1024;
        $megabyte = $kilobyte * 1024;
        $gigabyte = $megabyte * 1024;
        $terabyte = $gigabyte * 1024;
         */

        $kilobyte = 1000;
        $megabyte = $kilobyte * 1000;
        $gigabyte = $megabyte * 1000;
        $terabyte = $gigabyte * 1000;

        if (($bytes >= 0) && ($bytes < $kilobyte)) {
            return $bytes . ' B';
        } elseif (($bytes >= $kilobyte) && ($bytes < $megabyte)) {
            return round($bytes / $kilobyte, $precision) . ' KB';
        } elseif (($bytes >= $megabyte) && ($bytes < $gigabyte)) {
            return round($bytes / $megabyte, $precision) . ' MB';
        } elseif (($bytes >= $gigabyte) && ($bytes < $terabyte)) {
            return round($bytes / $gigabyte, $precision) . ' GB';
        } elseif ($bytes >= $terabyte) {
            return round($bytes / $terabyte, $precision) . ' TB';
        } else {
            return $bytes . ' B';
        }
    }

    /**
     * Change the Docker daemon settings
     *
     * @param string apiPort The new API port to use
     */
    function changeDockerSettings($apiPort, $absPath)
    {
        OMVModuleDockerUtil::stopDockerService();
        $fileName = "/etc/default/docker";
        $data = file_get_contents($fileName);
        $lines = explode("\n", $data);
        $result = "";
        $socketSet = false;
        foreach ($lines as $line) {
            if (strcmp($line, "### Do not change these lines. " .
                "They are added and updated by the OMV Docker GUI " .
                "plugin.") === 0) {
                    break;
                } else {
                    if (preg_match(
                        '/^DOCKER_OPTS.*unix\:\/\/\/var\/run\/docker\.sock.*$/',
                        $line)) {
                            $socketSet = true;
                        } elseif (
                            (preg_match('/^[^\#]+.*\-g[\s]?([^\"]+)[\s]?.*/',
                            $line,
                            $matches)) && (strcmp($absPath, "") !== 0)) {
                                OMVModuleDockerUtil::startDockerService();
                                throw new OMVModuleDockerException("Docker " .
                                    "base path relocation detected in " .
                                    "configuration file\n" .
                                    "Please remove it manually " .
                                    "($matches[1])\n");
                            }
                    $result .= $line . "\n";
                }
        }
        $result = rtrim($result);
        $result .= "\n\n" . '### Do not change these lines. They are added ' .
            'and updated by the OMV Docker GUI plugin.' . "\n";
        if ($socketSet) {
            $result .= 'OMVDOCKER_API="-H tcp://127.0.0.1:' . $apiPort .
                '"' . "\n";
        } else {
            $result .= 'OMVDOCKER_API="-H unix:///var/run/docker.sock ' .
                '-H tcp://127.0.0.1:' . $apiPort . '"' . "\n";

        }
        if (strcmp($absPath, "") !==0) {
            $result .= 'OMVDOCKER_IMAGE_PATH="-g ' . $absPath . '"' . "\n";
        } else {
            $result .= 'OMVDOCKER_IMAGE_PATH=""' . "\n";
        }
        $result .= 'DOCKER_OPTS="$DOCKER_OPTS $OMVDOCKER_API ' .
            '$OMVDOCKER_IMAGE_PATH"' . "\n" .
            '### Do not add any configuration below this line. It will be ' .
            'removed when the plugin is removed';
        file_put_contents("$fileName", $result);
        OMVModuleDockerUtil::startDockerService();
    }

    /**
     * Helper function to execute a command and throw an exception on error
     * (requires stderr redirected to stdout for proper exception message).
     *
     * @param string $cmd Command to execute
     * @param array &$out If provided will contain output in an array
     * @param int &$res If provided will contain Exit status of the command
     * @return string Last line of output when executing the command
     * @throws OMVModuleDockerException
     * @access public
     */
    public static function exec($cmd, &$out = null, &$res = null)
    {
        $tmp = OMVUtil::exec($cmd, $out, $res);
        if ($res) {
            throw new OMVModuleDockerException(implode("\n", $out));
        }
        return $tmp;
    }

}
