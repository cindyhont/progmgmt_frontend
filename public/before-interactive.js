const userMode = sessionStorage.getItem('userMode')
if (!!userMode && ['light','dark'].includes(userMode)) {
    document.getElementsByTagName('html')[0].style.backgroundColor = userMode === 'dark' ? 'black' : 'white'
} else {
    const systemDark = sessionStorage.getItem('systemDark')
    if (!!systemDark) document.getElementsByTagName('html')[0].style.backgroundColor = systemDark==='true' ? 'black' : 'white'
    else document.getElementsByTagName('html')[0].style.backgroundColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white'
}