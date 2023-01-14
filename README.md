# Project management tool - front end

This is just the front end of the app. The backend is <a href="https://github.com/cindyhont/projmgmt-backend" target="_blank">cindyhont/projmgmt-backend</a>.

14/01/2023: There is no test written. Jest shows an error because I use injected endpoints in RTK Query API. It seems Jest only recognizes the master API slice but ignores all the injected endpoints. Since the website is working fine with injected endpoints, this issue is to be fixed.