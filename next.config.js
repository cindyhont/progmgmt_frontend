module.exports = {
  assetPrefix:process.env.NODE_ENV === 'production' ? 'https://pm-cdn.cindyhodev.com' : undefined,
  async rewrites() {
    return [
      {source: '/api/:slug*',destination: `${process.env.API_URL}/:slug*`},
      ...['user-dark.svg','user-light.svg','tinymce/:slug*'].map(e=>({
        // source: `/${e}`,destination: `${process.env.NODE_ENV === 'production' ? 'https://pm-cdn.cindyhodev.com' : ''}/${e}`
        source: `/${e}`,destination: `${process.env.CDN_PREFIX}/${e}`
      })),
      {source: '/',destination: '/?page=dashboard'},
      ...[
        'chat',
        'hrm',
        'tasks',
        'settings',
        'about',
      ].map(i=>({source:`/${i}`,destination:`/?page=${i}`})),
      {source:'/tasks/t/:taskid',destination:'/?page=tasks&taskid=:taskid'},
      ...['list','board'].map(e=>({source:`/tasks/v/${e}`,destination:`/?page=tasks&view=${e}`})),
      {source:'/chat/r/:roomid',destination:'/?page=chat&roomid=:roomid'},
      {source:'/chat/u/:userid',destination:'/?page=chat&userid=:userid'}
    ]
  },
}