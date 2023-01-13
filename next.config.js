module.exports = {
  assetPrefix:process.env.NODE_ENV === 'production' ? 'https://pm-cdn.cindyhodev.com' : undefined,
  async rewrites() {
    return [
      {source: '/pm-api/:slug*',destination: `${process.env.API_URL}/:slug*`},
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