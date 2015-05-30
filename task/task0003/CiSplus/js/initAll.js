/**
 * 载入测试用数据，用来初始化DOM
 * @return {[type]} [description]
 */
function loadData() {
    //内部存储，入口就是taskListFirstLevel，用来找到第一层菜单，其value为第一层菜单对应的key，由“;”分隔
    //项目类别：0：一级菜单，1：二级菜单，2：task
    //第一层菜单的value值，分为两个部分：项目类别、菜单名称、子菜单key集合
    //第二层菜单的value值，分为四个部分：项目类别、菜单名称、父菜单key、该子菜单下task总数、该菜单下所有task的key
    //  task信息的value值，分为五个部分：项目类别、父菜单key、是否完成的tag(0未完成，1已完成)、该task的title、date、content
    storage.setItem("root", "0;1;2;3");
    storage.setItem("0", "0;默认分类;5");
    storage.setItem("1", "0;分类一;");
    storage.setItem("2", "0;分类二;6");
    storage.setItem("3", "0;分类三;");
    storage.setItem("5", "1;子类一;0;11,13");
    storage.setItem("6", "1;子类二;2;12");
    storage.setItem("11", "2;5;0;百度ife;2015-01-01;要交作业了");
    storage.setItem("12", "2;6;1;试一下;2015-01-02;测试内容");
    storage.setItem("13", "2;5;1;万度;2015-01-02;测试测试");
}
/**
 * 将会完成初始化显示的工作
 * 1.从localStorage中取数据，得到全部list组成的Arr
 * 2.根据Arr初始化任务列表
 * 3.根据任务列表选中项（默认为第一个一级菜单的第一个二级子菜单）初始化中间一列的内容
 * 4.根据中间列选中的内容（默认第一条task）初始化detail信息
 * @return {[type]} [description]
 */
function initAll() {
    var allMsgArr = getAllTaskList();
    initTaskList(allMsgArr);
    //中间列初始化为第一项一级菜单的第一个二级菜单
    //如果没有二级菜单,tag就是-1，那么中间列表就是空了
    //当然，如果这个二级菜单没有task，中间列表也是空了
    var ItemTag = -1;
    var secondLevelLi = $("#all-tasks-list").childNodes[0].getElementsByTagName("li");
    if (secondLevelLi.length != 0) {
        ItemTag = secondLevelLi[0].getElementsByTagName("p")[0].getAttribute("tag");
        secondLevelLi[0].getElementsByTagName("p")[0].setAttribute("class", "active-list");
    }
    //根据tag进行初始化中间列
    //用tag主要是可以根据tag来响应点击菜单的操作比较方便，存储过程key是唯一的，生成tag=key是唯一的
    initTaskItem(ItemTag);
    var detailTag = -1;
    var itemList = $("#task-items-list-desc").childNodes;
    if (itemList.length != 0) {
        var selectedTask = $("#task-items-list-desc").getElementsByClassName("task-title-line")[0];
        addClass(selectedTask, "active-task");
        detailTag = selectedTask.getAttribute("tag");
    }
    initTaskDetail(detailTag);
}
/**
 * 获取所有菜单和task信息
 * 返回一个数组，数组每一项都是是一级菜单对象，
 *               每个一级菜单对象的child值又是一个数组，包含该一级菜单下属所有二级菜单对象，
 *               每个二级菜单对象的child值又是一个数组，包含该二级菜单下的所有task对象
 * @return {[type]} [description]
 */
function getAllTaskList() {
    var firstLevel = storage.getItem("root");
    var firstLevelIDArr = firstLevel.split(";");
    //获取到一级菜单项
    var allMsgArr = new Array();
    for(var key = 0; key < firstLevelIDArr.length; key ++) {
        var msg = storage.getItem(firstLevelIDArr[key]);
        var msgArr = msg.split(";");
        var object = {
            tag   : firstLevelIDArr[key],
            type  : msgArr[0],
            title : msgArr[1],
            //child保存为数组，可以直接取length求子元素，就是当前分类下的所有任务数量
            child : msgArr[2].length == 0 ? null : msgArr[2].split(",")
        };
        //获取二级菜单项
        if (object.child != null) {
            var secondLevelIDArr = object.child;
            var firstLevelChild = new Array();
            for (var num = 0; num < secondLevelIDArr.length; num ++) {
                var secondLevelMsg = storage.getItem(secondLevelIDArr[num]);
                var secondLevelMsgArr = secondLevelMsg.split(";");
                var secondLevelObject = {
                    tag     : secondLevelIDArr[num],
                    type    : secondLevelMsgArr[0],
                    title   : secondLevelMsgArr[1],
                    parentID: secondLevelMsgArr[2],
                    child   : secondLevelMsgArr[3].length == 0 ? null : secondLevelMsgArr[3].split(",")
                };
                //获取每个二级菜单下属的task
                if (secondLevelObject.child != null) {
                    var taskListIDArr = secondLevelObject.child;
                    var taskListArr = new Array();
                    for (var tasknum = 0; tasknum < taskListIDArr.length; tasknum ++) {
                        var taskMsg = storage.getItem(taskListIDArr[tasknum]);
                        var taskMsgArr = taskMsg.split(";");
                        var taskObject = {
                            tag     : taskListIDArr[tasknum],
                            type    : taskMsgArr[0],
                            parentID: taskMsgArr[1],
                            done    : taskMsgArr[2],
                            title   : taskMsgArr[3],
                            date    : taskMsgArr[4],
                            content : taskMsgArr[5]
                        };
                        taskListArr.push(taskObject);
                    }
                    secondLevelObject.child = taskListArr;
                }
                firstLevelChild.push(secondLevelObject);
            }
            object.child = firstLevelChild;
        }
        allMsgArr.push(object);
    }
    return allMsgArr;
}
/**
 * 初始化左侧菜单列表
 * @param  {[type]} taskList 存储数据中所有菜单信息和task信息组成的数组    
 * @return {[type]}          [description]
 */
function initTaskList(taskList) {
    var pLabel = '<p id="default-list-item"><img class="folder-img img-tag" src="img/classify.png">默认分类(<span class="task-num" id="default-class">0</span>)</p>';
    var firstLevelImgTag = '<img class="folder-img img-tag" src="img/classify.png">';
    var secondLevelImgTag = '<img class="file-img img-tag" src="img/task.png">';
    var spanBefore = '(<span class="task-num" id="default-class">';
    var spanAfter = '</span>)';
    var spanDelete = '<img src="img/cancel.png" class="delete-list">';
    var listRoot = $("#all-tasks-list");
    listRoot.innerHTML = "";
    //计算任务总数
    var taskSum = 0;
    for (var key in taskList) {
        var firstLevelObject = taskList[key];
        //创建一级菜单列表
        var firstLevelLi = document.createElement("li");
        firstLevelLi.setAttribute("class", "first-level");
        var firstLevelP = document.createElement("p");
        firstLevelP.setAttribute("tag", firstLevelObject.tag);
        firstLevelP.innerHTML = "haahhahah";
        firstLevelLi.appendChild(firstLevelP);
        listRoot.appendChild(firstLevelLi);
        //计算该一级菜单下属所有任务总数
        var firstLevelSum = 0;
        if (firstLevelObject.child != null) {
            var secondLevelArr = firstLevelObject.child;
            var secondLevelUl = document.createElement("ul");
            for (var secondLevelKey in secondLevelArr) {
                var secondLevelObject = secondLevelArr[secondLevelKey];
                var secondLevelLi = document.createElement("li");
                secondLevelLi.setAttribute("class", "second-level");
                var secondLevelP = document.createElement("p");
                secondLevelP.setAttribute("tag", secondLevelObject.tag);
                var secondLevelChildSum = 0;
                if (secondLevelObject.child != null) {
                    secondLevelChildSum = secondLevelObject.child.length;
                }
                firstLevelSum += secondLevelChildSum;
                secondLevelP.innerHTML = secondLevelImgTag + secondLevelObject.title + spanBefore + secondLevelChildSum + spanAfter + spanDelete;
                secondLevelLi.appendChild(secondLevelP);
                secondLevelUl.appendChild(secondLevelLi);
            }
            firstLevelLi.appendChild(secondLevelUl);
        }
        firstLevelP.innerHTML = firstLevelImgTag + firstLevelObject.title + spanBefore + firstLevelSum +spanAfter;
        if (firstLevelObject.tag != 0) {
            firstLevelP.innerHTML += spanDelete;
        }
        taskSum += firstLevelSum;
    }
    $("#all-tasks-num").innerHTML = taskSum;
}
/**
 * 初始化中间列表
 * @param  {[type]} tag -1表示该二级菜单没有task
 * @return {[type]}     [description]
 */
function initTaskItem(tag) {
    if (tag == -1) {
        $("#task-items-list-desc").innerHTML = "";
        $("#task-items-list-desc").setAttribute("tag", "-1");
        return;
    }
    //如果该二级菜单下没有task就退出了
    if (storage.getItem(tag).split(";")[3].length == 0) {
        $("#task-items-list-desc").innerHTML = "";
        $("#task-items-list-desc").setAttribute("tag", tag);
        return;
    }
    var taskListIDArr = storage.getItem(tag).split(";")[3].split(",");
    initTaskItemByDone(taskListIDArr, 0);
}
/**
 * 根据要显示的列表和完成、未完成的标志位进行初始化中间列表
 * @param  {[type]} taskListArr 要用来初始化的列表
 * @param  {[type]} flag        0：全部;-1未完成;1完成
 * @return {[type]}             [description]
 */
function initTaskItemByDone(taskListIDArr, flag) {
    var taskListArr = new Array();
    var parentID = "-1";
    for (var tasknum = 0; tasknum < taskListIDArr.length; tasknum ++) {
        var taskMsg = storage.getItem(taskListIDArr[tasknum]);
        var taskMsgArr = taskMsg.split(";");
        var taskObject = {
            tag     : taskListIDArr[tasknum],
            type    : taskMsgArr[0],
            parentID: taskMsgArr[1],
            done    : taskMsgArr[2],
            title   : taskMsgArr[3],
            date    : taskMsgArr[4],
            content : taskMsgArr[5]
        };
        parentID = taskObject.parentID;
        if (flag == 0) {
            taskListArr.push(taskObject);
        } else if (flag == 1 && taskObject.done == "1") {
            taskListArr.push(taskObject);
        } else if (flag == -1 && taskObject.done == "0") {
            taskListArr.push(taskObject);
        } else {
            continue;
        }
    }
    var taskListInOrder = sortTaskByDate(taskListArr);
    var listRoot = $("#task-items-list-desc");
    if (!taskListInOrder) {
        listRoot.setAttribute("tag", parentID);
        listRoot.innerHTML = "";
        return;
    }
    // var listRoot = $("#all-tasks-list");
    
    listRoot.setAttribute("tag", taskListInOrder[0][0].parentID);
    listRoot.innerHTML = "";
    for (var dateKey in taskListInOrder) {
        var firstLevelLi = document.createElement("li");
        firstLevelLi.setAttribute("class", "first-level-date")
        var dateLabel = document.createElement("p");
        dateLabel.setAttribute("class", "task-date-line");
        var sameDateTaskArr = taskListInOrder[dateKey];
        dateLabel.innerHTML = sameDateTaskArr[0].date;
        firstLevelLi.appendChild(dateLabel);
        var secondLevelUl = document.createElement("ul");
        for (var i = 0; i < sameDateTaskArr.length; i ++) {
            var object = sameDateTaskArr[i];
            var secondLevelLi = document.createElement("li");
            if (object.done == 0) {
                secondLevelLi.setAttribute("class", "task-title-line task-undo");
            } else {
                secondLevelLi.setAttribute("class", "task-title-line task-done");
            }
            secondLevelLi.setAttribute("tag", object.tag);
            secondLevelLi.innerHTML = object.title;
            secondLevelUl.appendChild(secondLevelLi);
        }
        firstLevelLi.appendChild(secondLevelUl);
        listRoot.appendChild(firstLevelLi);
    }
}
/**
 * 根据task的date进行分组，并且按照日期逆序，最新的日期在最前
 * @param  {[type]} taskListArr 由task对象组成的无序数组
 * @return {[type]} 返回一个二维数组，第二维是日期相同的object
 */
function sortTaskByDate(taskListArr) {
    if (taskListArr.length == 0) {
        return;
    }
    var hash = {};
    var dateArr = new Array();
    for (var key in taskListArr) {
        var object = taskListArr[key];
        if (!hash[object.date]) {
            hash[object.date] = new Array(object);
            dateArr.push(object.date);
        } else {
            hash[object.date].push(object);
        }
    }
    var arrMS = new Array();
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    for (var i = 0; i < dateArr.length; i ++) {
        var arrTemp = dateArr[i].split("-");
        arrMS.push(d.setFullYear(parseInt(arrTemp[0]), parseInt(arrTemp[1]) - 1, parseInt(arrTemp[2])));
    }
    arrMS.sort(function(a, b) { return b - a;});
    for (var i = 0; i < arrMS.length; i ++) {
        d.setTime(arrMS[i]);
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var day = d.getDate();
        if (day < 10) {
            day = "0" + day;
        }
        var dateTemp = year + "-" + month + "-" + day;
        dateArr[i] = dateTemp;
    }
    var dateArrDesc = new Array();
    for (var key in dateArr) {
        dateArrDesc.push(hash[dateArr[key]]);
    }
    return dateArrDesc;
}
/**
 * 根据中间列选中的task的tag进行初始化右侧的detail区域
 * @param  {[type]} tag -1表示没有选中任何task,tag值为task的key值
 * @return {[type]}     [description]
 */
function initTaskDetail(tag) {
    //如果是-1那么就什么都不显示了
    if (tag == -1) {
        $("#task-detail").setAttribute("tag", "-1");
        $("#task-detail").setAttribute("taskID", "-1");
        $("#detail-title").innerHTML = "";
        $("#edit-title").style.display = "none";
        $("#edit-task").style.display = "none";
        $("#complete-task").style.display = "none";
        $("#preserve-change").style.display = "none";
        $("#cancel-change").style.display = "none";
        $("#submit-task").style.display = "none";
        $("#cancel-task").style.display = "none";
        $("#task-detail-date").style.display = "none";
        $("#edit-date").style.display = "none";
        $("#task-detail-content").style.display = "none";
        $("#edit-content").style.display = "none";
        return;
    }
    var taskMsgArr = storage.getItem(tag).split(";");
    //保留父类tag，留着变更信息时使用
    $("#task-detail").setAttribute("tag", taskMsgArr[1]);
    $("#task-detail").setAttribute("taskID", tag);
    //任务是否完成
    //完成了，只能查看，不能修改，就是单纯的显示
    //未完成，可以设置是否完成，是否修改等等
    if (taskMsgArr[2] == "1") {
        $("#detail-title").style.display = "inline";
        $("#detail-title").style.fontSize = "1.5em";
        $("#detail-title").innerHTML = taskMsgArr[3];
        $("#edit-title").style.display = "none";
        $("#edit-task").style.display = "none";
        $("#complete-task").style.display = "none";
        $("#preserve-change").style.display = "none";
        $("#cancel-change").style.display = "none";
        $("#submit-task").style.display = "none";
        $("#cancel-task").style.display = "none";
        $("#task-detail-date").style.display = "inline";
        $("#task-detail-date").innerHTML = "任务日期：" + taskMsgArr[4];
        $("#edit-date").style.display = "none";
        $("#task-detail-content").style.display = "inline";
        $("#task-detail-content").innerHTML = taskMsgArr[5];
        $("#edit-content").style.display = "none";
    } else {
        $("#detail-title").style.display = "inline";
        $("#detail-title").style.fontSize = "1.5em";
        $("#detail-title").innerHTML = taskMsgArr[3];
        $("#edit-title").style.display = "none";
        $("#preserve-change").style.display = "none";
        $("#cancel-change").style.display = "none";
        $("#edit-task").style.display = "inline";
        $("#complete-task").style.display = "inline";
        $("#submit-task").style.display = "none";
        $("#cancel-task").style.display = "none";
        $("#task-detail-date").style.display = "inline";
        $("#task-detail-date").innerHTML = "任务日期：" + taskMsgArr[4];
        $("#edit-date").style.display = "none";
        $("#task-detail-content").style.display = "inline";
        $("#task-detail-content").innerHTML = taskMsgArr[5];
        $("#edit-content").style.display = "none";
    }
}
/**
 * 点击新增任务按钮，初始化detail区域
 * @return {[type]} [description]
 */
function initNewTask() {
    $("#detail-title").style.display = "inline";
    $("#detail-title").style.fontSize = "1em";
    $("#detail-title").innerHTML = "任务标题：";
    $("#edit-title").style.display = "inline";
    $("#edit-title").value = "";
    $("#edit-task").style.display = "none";
    $("#complete-task").style.display = "none";
    $("#preserve-change").style.display = "none";
    $("#cancel-change").style.display = "none";
    $("#submit-task").style.display = "inline";
    $("#cancel-task").style.display = "inline";
    $("#task-detail-date").style.display = "inline";
    $("#task-detail-date").innerHTML = "任务日期：";
    $("#edit-date").style.display = "inline";
    $("#edit-date").value = "";
    $("#task-detail-content").style.display = "none";
    $("#task-detail-content").innerHTML = "";
    $("#edit-content").style.display = "inline";
    $("#edit-content").value = "";
}
/**
 * 点击未完成task的变更按钮，初始化detail区域
 * @return {[type]} [description]
 */
function initEditTask() {
    var detailTag = $("#task-detail").getAttribute("taskID");
    var taskMsgArr = storage.getItem(detailTag).split(";");
    $("#detail-title").style.display = "inline";
    $("#detail-title").style.fontSize = "1em";
    $("#detail-title").innerHTML = "任务标题：";
    $("#edit-title").style.display = "inline";
    $("#edit-title").value = taskMsgArr[3];
    $("#edit-task").style.display = "none";
    $("#complete-task").style.display = "none";
    $("#preserve-change").style.display = "inline";
    $("#cancel-change").style.display = "inline";
    $("#submit-task").style.display = "none";
    $("#cancel-task").style.display = "none";
    $("#task-detail-date").style.display = "inline";
    $("#task-detail-date").innerHTML = "任务日期：";
    $("#edit-date").style.display = "inline";
    $("#edit-date").value = taskMsgArr[4];
    $("#task-detail-content").style.display = "none";
    $("#task-detail-content").innerHTML = "";
    $("#edit-content").style.display = "inline";
    $("#edit-content").value = taskMsgArr[5];
}
/**
 * 初始化浮层中父级分类的下拉列表
 * @return {[type]} [description]
 */
function initClassOptions() {
    var selectRoot = $("#selected-parentID");
    selectRoot.innerHTML = "";
    var firstOption = document.createElement("option");
    firstOption.setAttribute("value", "-1");
    firstOption.innerHTML = "创建新的父级分类";
    selectRoot.appendChild(firstOption);
    var allMsgArr = getAllTaskList();
    for (var i = 0; i < allMsgArr.length; i ++) {
        var parentObj = allMsgArr[i];
        var option = document.createElement("option");
        option.setAttribute("value", parentObj.tag);
        option.innerHTML = parentObj.title;
        selectRoot.appendChild(option);
    }
}
/**
 * 根据tag获取该task对应的详细信息
 * @param  {[type]} tag 存储数据中task对应的key值
 * @return {[type]}     返回-1表示没有对应的数据
 */
function getMsgByTag(tag) {
    var value = storage.getItem(tag.toString());
    if (!value) {
        return -1;
    } else {
        var valueArr = value.split(";");
        if (valueArr[0] == "0") {
            return {
                type    : valueArr[0],
                title   : valueArr[1],
                child   : valueArr[2].length == 0 ? null : valueArr[2].split(",")
            };
        } else if (valueArr[0] == "1") {
            return {
                type    : valueArr[0],
                title   : valueArr[1],
                parentID: valueArr[2],
                child   : valueArr[3].length == 0 ? null : valueArr[3].split(",")
            };
        } else if (valueArr[0] == "2") {
            return {
                type    : valueArr[0],
                parentID: valueArr[1],
                done    : valueArr[2],
                title   : valueArr[3],
                date    : valueArr[4],
                content : valueArr[5]
            };
        }
    }
}