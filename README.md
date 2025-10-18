```js
javascript:(function(){
    const script = document.createElement('script');
    script.src = "https://[username].github.io/[reponame]/main.js?" + new Date().getTime();
    document.body.appendChild(script);
})();
```
