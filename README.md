```js
javascript:(function(){
    const script = document.createElement('script');
    script.src = "https://${username}.github.io/${RepoName}/main.js?" + new Date().getTime();
    document.body.appendChild(script);
})();
```
