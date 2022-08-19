<?php
declare(strict_types = 1);
namespace In2code\Luxletter\Domain\Service\BodytextManipulation\ImageEmbedding;

use In2code\Luxletter\Exception\MisconfigurationException;
use In2code\Luxletter\Utility\StringUtility;
use TYPO3\CMS\Core\SingletonInterface;
use UnexpectedValueException;

/**
 * Class Execution
 * To convert images in newletter bodytext
 */
class Execution extends AbstractEmbedding implements SingletonInterface
{
    /**
     * @var string
     */
    protected $content = '';

    /**
     * @param string $content
     * @return $this
     */
    public function setBodytext(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    /**
     * Get bodytext of a mail and rewrite src to (e.g.) "cig:name_1"
     *
     * Example return value:
     *  [
     *      'name_00000001' => '/var/www/imagehash1.jpg',
     *      'name_00000002' => '/var/www/imagehash2.jpg',
     *      'name_00000003' => '/var/www/imagehash1.jpg',
     *  ]
     *
     * @return array
     * @throws MisconfigurationException
     */
    public function getImages(): array
    {
        $this->checkInitialization();

        $images = [];
        $imageSources = [];
        preg_match_all('(<img\s+[^>]*src\s*=\s*(?:([\'"])(.+?)\\1|([^>\s]+)))i', $this->content, $imageSources);
        $imageSources = array_filter(array_unique(array_merge($imageSources[2], $imageSources[3])));
        $iterator = 1;
        foreach ($imageSources as $src) {
            if (StringUtility::isAbsoluteImageUrl($src)) {
                $pathAndFilename = $this->getNewImagePathAndFilename($src);
                if (file_exists($pathAndFilename)) {
                    $images[$this->getEmbedNameFromIterator($iterator)] = $pathAndFilename;
                    $iterator++;
                }
            }
        }
        return $images;
    }

    /**
     * Rewrite src to "cid:name_00000001"
     *
     * @return string
     * @throws MisconfigurationException
     */
    public function getRewrittenContent(): string
    {
        $this->checkInitialization();

        $imageSources = [];
        preg_match_all('(<img\s+[^>]*src\s*=\s*(?:([\'"])(.+?)\\1|([^>\s]+)))i', $this->content, $imageSources);
        $imageSources = array_filter(array_unique(array_merge($imageSources[2], $imageSources[3])));
        $iterator = 1;
        foreach ($imageSources as $src) {
            if (StringUtility::isAbsoluteImageUrl($src)) {
                $pathAndFilename = $this->getNewImagePathAndFilename($src);
                if (file_exists($pathAndFilename)) {
                    $this->content = str_replace($src, 'cid:' . $this->getEmbedNameFromIterator($iterator), $this->content);
                    $iterator++;
                }
            }
        }
        return $this->content;
    }

    /**
     * @param int $iterator
     * @return string "name_00000012"
     */
    protected function getEmbedNameFromIterator(int $iterator): string
    {
        return 'name_' . str_pad((string)$iterator, 8, '0', STR_PAD_LEFT);
    }

    /**
     * @return void
     */
    protected function checkInitialization(): void
    {
        if ($this->content === '') {
            throw new UnexpectedValueException('No bodytext given for image embedding', 1637319117);
        }
    }
}
