const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Her build aldığında dist klasörünü temizler
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/template.html', // Senin hazırladığın HTML'i baz alır
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'], // CSS'leri JS'e gömer
      },
    ],
  },
  devServer: {
    watchFiles: ['./src/template.html'], // HTML değişince de sayfayı yeniler
  },
};