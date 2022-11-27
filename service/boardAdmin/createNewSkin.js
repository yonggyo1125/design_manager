const fs = require('fs').promises;
const path = require('path');

/**
 * 스킨 복사 생성
 * 
 * @param {*} id 
 */
module.exports = async (id, skinType) => {
    if (!id || !skinType) {
        return;
    }
   

    try {
        const adminSkinDir = path.join(__dirname, "../../views/board/admin/skins", skinType);
        const skinDir = path.join(__dirname, "../../views/board/skins", id);
        const files = await fs.readdir(adminSkinDir);
        if (files.length == 0) {
            return;
        }
        
        /** 복사될 스킨 디렉토리 생성 S */
        try {
            await fs.readdir(skinDir);
        } catch (err) {
            await fs.mkdir(skinDir);
        }

        /** 복사될 스킨 디렉토리 생성 E */

        for (const file of files) {
            const srcPath = path.join(adminSkinDir, file);
            const destPath = path.join(skinDir, file);
            await fs.copyFile(srcPath, destPath);
        }

    } catch (err) {
        console.error(err);
    }
};