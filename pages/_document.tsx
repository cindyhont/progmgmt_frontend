import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <Script
            strategy='beforeInteractive'
            id='theme-beforeInteractive'
            dangerouslySetInnerHTML={{
              __html: `
              (function(){
                const userMode = sessionStorage.getItem('userMode')
                if (!!userMode && ['light','dark'].includes(userMode)) {
                  document.getElementsByTagName('html')[0].style.backgroundColor = userMode === 'dark' ? 'black' : 'white'
                  return
                }

                const systemDark = sessionStorage.getItem('systemDark')
                if (!!systemDark) document.getElementsByTagName('html')[0].style.backgroundColor = systemDark==='true' ? 'black' : 'white'
                else document.getElementsByTagName('html')[0].style.backgroundColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white'
              })();
            `,
            }}
          />
          <Script id='tinymce' src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/tinymce/tinymce.min.js`} strategy="beforeInteractive" async defer />
          <Script id='google-chart-loader' src="https://www.gstatic.com/charts/loader.js" strategy="beforeInteractive" async defer />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
