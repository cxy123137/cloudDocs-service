项目连接mongodb
1.官网下载mongodb后，在bin目录下执行命令启动db，窗口不要关闭
    mongod -dbpath D:\MongoDB\data\db
2.vscode下载mongodb for VScode的插件，左侧栏会显示一个叶子（没有的话重启）
3.使用插件，输入localhost:27017，连接本机mongodb
4.点击createNewPlayground，用以下建表语句替换掉，左上角执行建表语句


项目启动
1.第一次启动项目，需要下载依赖
npm install
2.启动
npm start

接口测试
可以用网页版的apifox，也可以用postman，或者浏览器输入接口地址