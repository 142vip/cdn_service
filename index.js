'use strict';
const fs=require('fs')
/**
 * 循环遍历当前目录下的所有文件
 */

function getAllFIle(dirName,filesList){
    // 获取当前目录下的文件|目录名
    const files = fs.readdirSync(dirName); // 需要用到同步读取
    files.forEach((file) => {
        const states = fs.statSync(dirName + "/" + file);
        if (states.isDirectory()) {
            getAllFIle(dirName + "/" + file, filesList);
        } else {
            // 不是就将文件push进数组，此处可以正则匹配是否是 .js 先忽略
            filesList.push(dirName+ "/" + file);
        }
    });

}
let filesList=[]
getAllFIle(`${__dirname}`,filesList)

console.log(filesList)

for(let filename of filesList){
    console.log(filename)
}