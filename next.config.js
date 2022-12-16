module.exports = {
  // ...(process.env.NEXT_PUBLIC_NODE_ENV === 'production' && {assetPrefix:'https://pm-cdn.cindyhodev.com'}),
  assetPrefix:'https://pm-cdn.cindyhodev.com',
  async rewrites() {
    return [
      {source: '/api/:slug*',destination: `${process.env.API_URL}/:slug*`},
      {source: '/',destination: '/?page=dashboard'},
      ...[
        'chat',
        'hrm',
        'tasks',
        'settings',
        'about',
      ].map(i=>({source:`/${i}`,destination:`/?page=${i}`})),
      ...['tasks/t','tasks/v','chat/r','chat/u'].map(e=>({source:`/${e}/tinymce/:slug*`,destination:'/tinymce/:slug*'})),
      {source:'/tasks/t/:taskid',destination:'/?page=tasks&taskid=:taskid'},
      ...['list','board'].map(e=>({source:`/tasks/v/${e}`,destination:`/?page=tasks&view=${e}`})),
      {source:'/chat/r/:roomid',destination:'/?page=chat&roomid=:roomid'},
      {source:'/chat/u/:userid',destination:'/?page=chat&userid=:userid'}
    ]
  },
}