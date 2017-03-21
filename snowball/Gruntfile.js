'use strict';
var path = require('path');
module.exports = function(grunt) {
    // 重新设置 grunt 的项目路径，获取当前的 package.json 文件信息
    grunt.file.setBase(__dirname);
    // 获取当前目录相对于共享 node_modules 目录的路径(以windows下面为例)
    var nodepath = path.relative(__dirname, 'D:/code/node_modules/');
    var pkg = grunt.file.readJSON('package.json');
    var comm = grunt.file.readJSON('../globconfig.json');
    //加载监视模块
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-watch", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-replace-pas", 'tasks'));
    // grunt.loadNpmTasks('grunt-contrib-watch');
    // grunt.loadNpmTasks('grunt-replace-pas');
    var buildVersion = comm.version;
    var javascript_namesuffix = "_temp";
    grunt.initConfig({
        pkg: pkg,
        //传输文件
        transport: {
            snowball: {
                options: {
                    format: 'https://cdn.stock.pingan.com.cn/html/aylc/snowball/build/{{filename}}',
                    removesuffix: javascript_namesuffix //需要在seajs里面移除的map后缀
                },
                files: [{
                    cwd: 'js', //源代码目录
                    src: '*.js',
                    dest: '.build' //build中转目录
                }]
            }
        },
        jshint: {
            files: {
                src: ['js/*.js']
            },
            options: {
                globals: {
                    sub: true, //对于属性使用a.b而不是a['b']
                    eqeqeq: true //对于简单类型，使用===和!==，而不是==和!=
                }
            }
        },
        //合并
        concat: {
            resetpwd: {
                files: {
                    //合并，筛选出需要的文件到正式目录
                    'build/js/index.js': ['.build/index' + javascript_namesuffix + '.js']
                }
            }
        },
        //监视
        /*watch: {
            Report: {
                files: ["Report/*.js"],
                tasks: ['transport', 'concat', 'uglify', 'clean']
            }
        },*/
        //压缩
        uglify: {
            main: {
                options: {
                    /*beautify: {
                                            width: 80,
                                            beautify: true
                                        },*/
                    mangle: { //不做混淆的变量
                        except: ["zepto", "Global", "require"]
                    } //,
                    //report: "gzip"//显示gzip压缩后的文件大小
                },
                files: [{
                    expand: true,
                    cwd: 'build/js',
                    src: '*.js',
                    dest: 'build'
                }]
            }
        },
        //css压缩
        cssmin: {
            combine: {
                files: {
                    '.build/css/index_publish.css': ['.build/comm' + javascript_namesuffix + '.css', '.build/snowball' + javascript_namesuffix + '.css']
                }
            },
            minify: {
                expand: true,
                cwd: '.build/css/',
                src: ['*.css', '!*.min.css'],
                //src: '.build/css/index_publish.css',
                dest: 'css'
                /*,
                ext: '.min.css'*/
            }
        },

        //图片压缩
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 3 //定义 PNG 图片优化水平
                },
                files: [{
                    expand: true,
                    cwd: 'images/', // 图片在imagemin目录下
                    src: ['**/*.{png,jpg,jpeg}'], // 优化 imagemin 目录下所有 png/jpg/jpeg 图片
                    dest: 'images/' // 优化后的图片保存位置，覆盖旧图片，并且不作提示
                }]
            }
        },
        //清理文件
        clean: {
            build: ['.build', 'build/js', 'js/index_temp.js', 'dist'] //删掉中转目录
        },
        replace: {
            html: {
                /** @required  - string including grunt glob variables */
                //src: '*.html',
                src: ['index.html'],
                /** @optional  - string directory name*/
                dest: './',
                /** @optional  - references external files to be included */
                /*includes: {
                    analytics: './ga.inc' // in this case it's google analytics (see sample below)
                },*/
                /** any other parameter included on the options will be passed for template evaluation */
                options: {
                    buildNumber: buildVersion,
                    type: "html"
                }
            },
            config: {
                src: ['js/config.js'],
                dest: 'build/js/',
                namesuffix: "", //不加后缀
                options: {
                    buildNumber: buildVersion,
                    type: "javascript"
                }
            },
            javascript: {
                src: ['js/index.js'],
                dest: 'js/',
                namesuffix: javascript_namesuffix,
                options: {
                    buildNumber: buildVersion,
                    type: "javascript"
                }
            },
            css: {
                src: ['css/snowball.css', '../css/comm.css'],
                dest: '.build/',
                namesuffix: javascript_namesuffix,
                options: {
                    buildNumber: buildVersion,
                    type: "css"
                }
            }
        }
    });

    grunt.task.loadTasks(path.join(nodepath, "grunt-transport-pas", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-cmd-concat", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-uglify", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-clean", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-cssmin", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-jshint", 'tasks'));
    grunt.task.loadTasks(path.join(nodepath, "grunt-contrib-imagemin", 'tasks'));
    // grunt.loadNpmTasks('grunt-transport-pas');
    // grunt.loadNpmTasks('grunt-cmd-concat');
    // grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-contrib-clean');
    // grunt.loadNpmTasks('grunt-contrib-cssmin');
    // grunt.loadNpmTasks('grunt-contrib-jshint');


    grunt.registerTask('build', ['replace', 'transport', 'concat', 'jshint', 'uglify', 'cssmin', 'clean', 'imagemin']);
    /*grunt.registerTask('build', ['replace','transport', 'concat','jshint','uglify','cssmin']);*/
    /*grunt.registerTask('build', ['transport']);*/


}
