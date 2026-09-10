const fs = require('fs');
if (fs.existsSync('bot_config.json')) {
    fs.unlinkSync('bot_config.json');
    console.log("Config wiped");
}
