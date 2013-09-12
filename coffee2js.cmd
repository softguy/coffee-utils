@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\coffee2js.js" %*
) ELSE (
  node  "%~dp0\coffee2js.js" %*
)