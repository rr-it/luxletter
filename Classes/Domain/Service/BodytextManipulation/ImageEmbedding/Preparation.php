<?php
declare(strict_types = 1);
namespace In2code\Luxletter\Domain\Service\BodytextManipulation\ImageEmbedding;

use In2code\Luxletter\Exception\ApiConnectionException;
use In2code\Luxletter\Exception\MisconfigurationException;
use In2code\Luxletter\Utility\FileUtility;
use In2code\Luxletter\Utility\StringUtility;
use TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationExtensionNotConfiguredException;
use TYPO3\CMS\Core\Configuration\Exception\ExtensionConfigurationPathDoesNotExistException;
use TYPO3\CMS\Core\Http\RequestFactory;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Class Preparation
 * To store images locally as a preparation for sending newsletters later
 */
class Preparation extends AbstractEmbedding
{
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->createTempFolderIfNotExists();
    }

    /**
     * Store images locally
     *
     * @param string $bodytext newsletter bodytext
     * @return void
     * @throws ApiConnectionException
     * @throws MisconfigurationException
     * @throws ExtensionConfigurationExtensionNotConfiguredException
     * @throws ExtensionConfigurationPathDoesNotExistException
     */
    public function storeImages(string $bodytext): void
    {
        if ($this->isActive()) {
            $imageSources = [];
            preg_match_all('(<img\s+[^>]*src\s*=\s*(?:([\'"])(.+?)\\1|([^>\s]+)))i', $bodytext, $imageSources);
            $imageSources = array_filter(array_unique(array_merge($imageSources[2], $imageSources[3])));
            foreach ($imageSources as $src) {
                if (StringUtility::isAbsoluteImageUrl($src)) {
                    $this->storeImage($src);
                }
            }
        }
    }

    /**
     * @param string $src like "https://domain.org/image.png"
     * @return void
     * @throws ApiConnectionException
     * @throws MisconfigurationException
     */
    protected function storeImage(string $src): void
    {
        GeneralUtility::writeFile(
            $this->getNewImagePathAndFilename($src),
            $this->getImageContent($src),
            true
        );
    }

    /**
     * @param string $url
     * @return string
     * @throws ApiConnectionException
     */
    protected function getImageContent(string $url): string
    {
        try {
            $requestFactory = GeneralUtility::makeInstance(RequestFactory::class);
            $response = $requestFactory->request($url);
            if ($response->getStatusCode() === 200) {
                $content = $response->getBody()->getContents();
            } else {
                throw new ApiConnectionException('Image could not be fetched from ' . $url, 1637265921);
            }
        } catch (\Exception $exception) {
            throw new ApiConnectionException($exception->getMessage(), 1637265924);
        }
        return $content;
    }

    /**
     * Create temp folder if it is not existing. Also add a .htacces file for a permission denied for requests over
     * apache to this folder.
     *
     * @return void
     */
    protected function createTempFolderIfNotExists()
    {
        $path = GeneralUtility::getFileAbsFileName($this->imageFolder);
        FileUtility::createFolderIfNotExists($path);
        FileUtility::createPermissionDeniedHtaccessFileIfNotExists($path . '.htaccess');
    }
}
