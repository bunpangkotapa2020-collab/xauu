async function run() {
  try {
    const res = await fetch('https://doesnotexist.teleeeegram.org');
    console.log(res.status);
  } catch(e) {
    console.log('CAUGHT:', e.message);
  }
}
run();
