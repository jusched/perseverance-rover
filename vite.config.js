// el archivo de waypoints de la NASA no envia cabeceras CORS: el dev server lo reenvia
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
