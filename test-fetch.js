fetch("https://doesnotexist.teleeeegram.org").then(r => console.log(r.status)).catch(e => console.log("ERROR: " + e.message))
