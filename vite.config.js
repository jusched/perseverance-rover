// the NASA waypoints file sends no CORS headers: the dev server forwards it
export default {
  server: {
    proxy: {
      '/mmgis': {
        target: 'https://mars.nasa.gov',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/mmgis/, '/mmgis-maps/M20/Layers/json'),
      },
    },
  },
};
