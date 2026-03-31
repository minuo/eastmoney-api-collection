import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/fund': {
        target: 'https://fund.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ''),
        secure: true
      },
      '/api/push2': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/push2/, ''),
        secure: true
      },
      '/api/push2his': {
        target: 'https://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/push2his/, ''),
        secure: true
      },
      '/api/fundmobapi': {
        target: 'https://fundmobapi.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fundmobapi/, ''),
        secure: true
      },
      '/api/dataapi': {
        target: 'https://dataapi.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dataapi/, ''),
        secure: true
      },
      '/api/data': {
        target: 'https://data.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/data/, ''),
        secure: true
      },
      '/api/quote': {
        target: 'https://quote.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/quote/, ''),
        secure: true
      },
      '/api/huilv': {
        target: 'https://webapi.huilv.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/huilv/, ''),
        secure: true
      },
      '/api/fundgz': {
        target: 'http://fundgz.1234567.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fundgz/, ''),
        secure: true
      }
    }
  }
})
