const { unlink } = require('fs');
const path = require('path');
const fs = require('fs').promises;

/**
 * 스킨 디렉토리 삭제 
 * 
 */
module.exports = async (ids) => {

    if (!(ids instanceof Array)) {
        ids = [ids];
    }

    const skinRootPath = path.join(__dirname, "../../views/board/skins");
    for await (const id of ids) {
        try {
            const skinPath = path.join(skinRootPath, id);
            const files = await fs.readdir(skinPath);
            for await (const file of files) {
                const filePath = path.join(skinPath, file);
                await fs.unlink(filePath);
            }
            await fs.rmdir(skinPath);
        } catch (err) {
            console.log(err);
        }
    }
};