
const {resolveFlow} = require('./dist');

module.exports = async function loader() {
    const data = await resolveFlow(this.resourcePath, 'bundle');

    const rawData = JSON.stringify(data)
      .replace(/"__BUNDLE\:\[\[(.+?)\]\]"/g, (_, p1) => {
          return `require('./${p1}')`;
      })
    
    return `export default ${rawData}`;
  }