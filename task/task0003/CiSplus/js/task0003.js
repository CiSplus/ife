/**
 * 总结一下
 * 1、思路上是想着，存数据与用数据展示分开来，朝着MVC靠，但是实现过程中问题多多，会的太少，想的太多。结果是：肯定不是MVC。。。
 * 
 * 2、实现过程：存上初始数据->取数据，对页面进行展示->为需要响应的操作进行事件绑定
 *     2.1、存取数据直接使用的就是localStorage，没有考虑userData，因为查了一下说是IE8+是支持localStorage的，但是我试了一下IE，不好使啊
 *         其实可以自己封装，兼容各种浏览器，封装用到的也是，判断是否支持localStorage，支持就用window.localStorage，不支持，就用userData，
 *         套了一层。在这里面没有自己封装，因为发现自己写的代码有点太多太乱了，就没做这个封装。
 *     2.2、页面展示相关的，放在了initAll.js文件中。如果都放在同一个文件里，感觉有点乱，并且相关性并不大。也算是显示和响应逻辑半分离了。。。
 *     2.3、关于事件的绑定方面，左边和中间的列表用了事件代理，很好使。其他一些按钮什么的，没有代理，主要是这些按钮是固定的，数量不多，
 *         并且存在着按钮之间的状态相互关联，用了代理，相当于对按钮分了类，响应操作处理起来可能会更加麻烦。
 *         
 * 3、页面展示方面，分了三大部分，分别是左中右三个区域的显示，外加增加分类的浮层操作。
 *    显示方面，自认为三个部分应该相互关联，因此，有些操作完成后，会更新相应的部分，甚至更新所有三个部分。
 *    比如，一个未完成的task，点击了完成后，那么状态就变了，右侧部分刷新，中间部分也会刷新一次。
 *    具体都是哪些，还是看自己当时写的时候脑子怎么想的关联逻辑。。。。
 *    
 * 4、各种操作的相应方面，放在这个文件里，添加各种事件代理，各种click事件。
 *    想法很简单，挨着加事件，但是写出来之后，发现，各种响应函数写了好多，乱。如果多些文件不犯法，真想每个事件函数都写成独立的文件。。。
 *    
 * 5、写之前，看了好多天js面向对象，但是发现看着好混乱，很糊涂。结果现在写出来的代码，就没面向对象，更像是面向过程吧，混乱了。
 * 
 */
var editFlag = false;//用来判定是否在修改task或者添加新的task
var storage = window.localStorage;
/**
 * 入口，也是主体
 * @return {[type]} [description]
 */
window.onload = function() {
    if (!window.localStorage) {
        alert("哎呀~浏览器不支持localStorage~不干了(╯‵□′)╯︵┻━┻");
        return;
    }
    //载入初始化的数据
    if (!storage.getItem("root")) {
        loadData();
    }
    // loadData();
    //初始化页面DOM
    initAll();
    addEventForAll();
}
/**
 * 用来判断是否存在有尚未保存的更改，当操作会涉及到变更右侧页面时，就弹出提示
 * 放弃修改，返回true，同时将editFlag置为false
 * 不放弃修改，返回false
 * @return {[type]} [description]
 */
function alertEditStatus() {
    if (editFlag) {
        var flag = confirm("确定要放弃对任务的修改吗？");
        if (flag) {
            editFlag = false;
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}
/**
 * 为各种操作添加响应事件
 * 也有两个单独拿出来，添加响应事件的
 */
function addEventForAll() {
    //为左侧任务列表每一项添加鼠标悬浮显示删除按钮操作
    $.delegate("#all-tasks-list", "p", "mouseover", listMouseOver);
    //对于左侧任务列表中每个p标签，事件代理click
    $.delegate("#all-tasks-list", "p", "click", listClick);
    //对于中间列表中的完成状态，事件代理click
    $.delegate(".task-items-header", "label", "click", statusClick);
    //对于中间列表中的各个task进行事件代理，click
    $.delegate("#task-items-list-desc", "li", "click", taskClick);
    //新增任务
    $.click("#add-task", addNewTask);
    //未完成任务变更为完成
    $.click("#complete-task", completeTask);
    //未完成任务变更
    $.click("#edit-task", editTask);
    //新增分类
    $.click("#add-class", addNewClass);
}
/**
 * 当鼠标滑过左侧菜单列表时，显示删除图标
 * 并且为每个删除图标添加删除当前列表的相关响应事件
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function listMouseOver(e) {
    var e = e || event;
    var target = e.target || e.srcElement;
    var deleteImg = target.getElementsByClassName("delete-list");
    //如果没有删除按钮，就不用显示什么了，就结束了
    if (deleteImg.length == 0) {
        return;
    }
    deleteImg[0].style.display = "inline";
    addEvent(target, "mouseleave", function() {
        deleteImg[0].style.display = "none";
    });
    //为删除图标添加删除的响应事件
    addClickEvent(deleteImg[0], deleteList);
}
/**
 * 列表删除图标的响应事件
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function deleteList(e) {
    if (!alertEditStatus()) {
        return;
    }
    var e = e || event;
    var target = e.target || e.srcElement;
    var listNode = target.parentNode;
    var tag = listNode.getAttribute("tag");
    var title = storage.getItem(tag).split(";")[1];
    var flag = confirm("删除后无法找回！确定要删除<" + title + ">下所有子菜单和task吗？");
    if (!flag) {
        return;
    }
    removeClassList(tag);
}
/**
 * 根据列表对应的tag，删除响应的菜单项
 * 可以删除一级菜单，或者二级菜单
 * @param  {[type]} tag 要删除的列表对应的tag
 * @return {[type]}     [description]
 */
function removeClassList(tag) {
    if (tag == -1) {
        return;
    }
    var nodeMsgArr = storage.getItem(tag).split(";");
    //一级菜单
    if (nodeMsgArr[0] == 0) {
        if (trim(nodeMsgArr[2]) && trim(nodeMsgArr[2]).length != 0) {
            //二级菜单组合
            var childNodeArr = trim(nodeMsgArr[2]).split(",");
            for (var i = 0; i < childNodeArr.length; i ++) {
                //task组合
                var taskList = storage.getItem(childNodeArr[i]).split(";")[3];
                if(trim(taskList) && trim(taskList).length != 0) {
                    //一次删除task
                    var taskListArr = taskList.split(",");
                    for (var j = 0; j < taskListArr.length; j ++) {
                        storage.removeItem(taskListArr[j]);
                    }
                }
                //删完task，删二级菜单
                storage.removeItem(childNodeArr[i]);
            }
        }
        //删完二级菜单，删一级菜单
        storage.removeItem(tag);
        //删完一级菜单，修改taskListFirstLevel的value值
        var rootValue = storage.getItem("root");
        var separator = ";";
        var changedValue = deleteValue(rootValue, tag, separator);
        storage.setItem("root", changedValue);
    }
    //二级菜单
    else {
        //task组合
        var taskList = storage.getItem(tag).split(";")[3];
        if(trim(taskList) && trim(taskList).length != 0) {
            //一次删除task
            var taskListArr = taskList.split(",");
            for (var j = 0; j < taskListArr.length; j ++) {
                storage.removeItem(taskListArr[j]);
            }
        }
        //删完task，删二级菜单
        storage.removeItem(tag);
        //修改一级菜单
        var parentValueArr = storage.getItem(nodeMsgArr[2]).split(";");
        var parentValueChild = parentValueArr[2];
        var separator = ",";
        var changedParentValueChild = deleteValue(parentValueChild, tag, separator);
        var changedParentValue = parentValueArr[0] + ";" +parentValueArr[1] + ";" +changedParentValueChild;
        storage.setItem(nodeMsgArr[2], changedParentValue);
    }
    initAll();
}
/**
 * 根据分隔符的不同，删除字符串root中与tag相匹配的子串
 * 不管主字符串是否含有与tag相匹配的内容，都可以进行删除操作，只不过返回的还是原主字符串
 * @param  {[type]} root      要删除特定内容的主字符串
 * @param  {[type]} tag       要删除的特定子串
 * @param  {[type]} separator root字符串中的分隔符
 * @return {[type]}           主串为空，返回空，子串不为空，返回删除后的字符串
 */
function deleteValue(root, tag, separator) {
    if (!trim(root) || trim(root).length == 0) {
        return;
    }
    var rootArr = root.split(separator);
    var tempArr = new Array();
    for (var i = 0; i < rootArr.length; i ++) {
        if (rootArr[i] == tag) {
            continue;
        } else {
            tempArr.push(rootArr[i]);
        }
    }
    return tempArr.join(separator);
}
/**
 * 点击左侧菜单的响应事件
 * 点击左侧菜单列表，刷新选中列表项的状态，改变背景色，并且刷新中间列表和右侧task信息
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function listClick(e) {
    if (!alertEditStatus()) {
        return;
    }
    var e = e || event;
    var target = e.target || e.srcElement;
    var targetMsg = getMsgByTag(target.getAttribute("tag"));
    if (targetMsg == -1) {
        return;
    }
    //初始化中间列表信息
    var itemTag = -1;
    //清除以前被选中list的状态，方便后面选中哪个再进行设置
    var activeList = $("#all-tasks-list").getElementsByClassName("active-list");
    if (activeList.length != 0) {
        for (var i = 0; i < activeList.length; i ++) {
            removeClass(activeList[i], "active-list");
        }
    }
    if (targetMsg.type == "0") {
        if (target.parentNode.getElementsByTagName("li").length != 0) {
            var firstChildLi = target.parentNode.getElementsByTagName("li")[0];
            addClass(firstChildLi.getElementsByTagName("p")[0], "active-list");
            itemTag = firstChildLi.getElementsByTagName("p")[0].getAttribute("tag");
        }
        initTaskItem(itemTag);
    } else {
        addClass(target, "active-list");
        initTaskItem(target.getAttribute("tag"));
    }
    //初始化detail信息
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
 * 点击中间列表的不同标签的响应事件
 * 点击中间列表的头部标签，选择不同完成状态的task
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function statusClick(e) {
    if (!alertEditStatus()) {
        return;
    }
    var e = e || event;
    var target = e.target || e.srcElement;
    //不管下面的列表是否会有内容，label的状态还是要变的。就先变了。
    var targetID = target.getAttribute("id");
    var activeLabel = $(".task-items-header").getElementsByClassName("active-label");
    if (activeLabel.length != 0) {
        for (var i = 0; i < activeLabel.length; i ++) {
            removeClass(activeLabel[i], "active-label");
        }
    }
    target.setAttribute("class", "active-label");
    var tag = $("#task-items-list-desc").getAttribute("tag");
    if (tag == "-1") {
        $("#task-items-list-desc").innerHTML = "";
        return;
    }
    if (storage.getItem(tag).split(";")[3].length == 0) {
        $("#task-items-list-desc").innerHTML = "";
        $("#task-items-list-desc").setAttribute("tag", tag);
        return;
    }
    var taskListIDArr = storage.getItem(tag).split(";")[3].split(",");
    if (targetID == "select-all") {
        initTaskItemByDone(taskListIDArr, 0);
    } else if (targetID == "select-undo") {
        initTaskItemByDone(taskListIDArr, -1);
    } else {
        initTaskItemByDone(taskListIDArr, 1);
    }
    var itemList = $("#task-items-list-desc").childNodes;
    var detailTag = -1;
    if (itemList.length != 0) {
        var selectedTask = $("#task-items-list-desc").getElementsByClassName("task-title-line")[0];
        addClass(selectedTask, "active-task");
        detailTag = selectedTask.getAttribute("tag");
    }
    initTaskDetail(detailTag);
}
/**
 * 点击中间列表中不同的事件的响应事件
 * 更改事件背景色，并且刷新右侧task信息
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function taskClick(e) {
    if (!alertEditStatus()) {
        return;
    }
    var e = e || event;
    var target = e.target || e.srcElement;
    var targetTag = target.getAttribute("tag");
    if (!targetTag) {
        return;
    }
    var activeTask = $("#task-items-list-desc").getElementsByClassName("active-task");
    if (activeTask.length != 0) {
        for (var i = 0; i < activeTask.length; i ++) {
            removeClass(activeTask[i], "active-task");
        }
    }
    addClass(target, "active-task");
    initTaskDetail(targetTag);
}
/**
 * 点击新建任务按钮的响应事件
 * 变更右侧task信息
 */
function addNewTask() {
    if (!alertEditStatus()) {
        return;
    }
    if ($("#task-items-list-desc").getAttribute("tag") == "-1") {
        alert("请先创建二级目录");
        return;
    }
    initNewTask();
    editFlag = true;
}
/**
 * 为新建任务后，右侧区域中的取消按钮添加响应事件
 * @return {[type]} [description]
 */
$.click("#cancel-task", function() {
    var taskID = $("#task-detail").getAttribute("taskID");
    initTaskDetail(taskID);
    editFlag = false;
});
/**
 * 为新建任务后，右侧区域中的确定按钮添加响应事件
 * 添加新任务后，应该刷新左中右所有区域才行
 * @return {[type]} [description]
 */
$.click("#submit-task", function() {
    var check = checkInput();
    if (check) {
        storeNewTask(check);
        //增加一个项目之后，从左到右都应该刷新一遍，从左到右都应发生变化
        initAll();
        editFlag = false;
    } else {
        return;
    }
});
/**
 * 检查右侧区域task的输入信息是否正确
 * 若不正确，返回false，若正确，将返回由，task.title,task.date以及task.content组成的数组
 * @return {[type]} [description]
 */
function checkInput() {
    var title = $("#edit-title").value;
    if (trim(title).length > 20) {
        alert("标题长度不应多余20个字符");
        return false;
    }
    if (trim(title).length == 0) {
        alert("请输入标题");
        return false;
    }
    var date = $("#edit-date").value;
    var checkedDate = checkDate(date);
    if (!checkedDate) {
        return false;
    }
    date = checkedDate;
    var content = $("#edit-content").value;
    if (trim(content).length > 200) {
        alert("to-do不应多于200字符");
        return false;
    }
    if (trim(content).length == 0) {
        alert("请输入to-do内容");
        return false;
    }
    var msg = new Array(title, date, content);
    return msg;
}
/**
 * 根据新填写的task数据，保存数据
 * @param  {[type]} msg 由task的title,date,content组成的数组
 * @return {[type]}     [description]
 */
function storeNewTask(msg) {
    var d = new Date();
    var key = d.getTime() + "";
    var parentID = $("#task-items-list-desc").getAttribute("tag");
    var value = "2" + ";" + parentID + ";" + "0" + ";" + msg[0] + ";" + msg[1] + ";" + msg[2];
    storage.setItem(key, value);
    var parentValue = trim(storage.getItem(parentID));

    var parentChild = parentValue.split(";")[3];
    //通过判断一级菜单有没有子元素，添加子元素tag时，是否需要在前面加上","
    if (parentChild.length == 0 || trim(parentChild).length == 0) {
        parentValue = parentValue + "" + key;
    } else {
        parentValue = parentValue + "," + key;
    }
    storage.setItem(parentID, parentValue);
}
/**
 * 检查输入的日期是否正确
 * 若正确，返回日期，格式固定为yyyy-mm-dd，位数也一致
 * @param  {[type]} date [description]
 * @return {[type]}      [description]
 */
function checkDate(date) {
    var inputDate = date;
    if (!inputDate || trim(inputDate).length == 0) {
        alert("请输入日期");
        return false;
    }
    var inputDate = trim(inputDate);
    var inputDateArr = inputDate.split("-");
    if (inputDateArr.length != 3) {
        alert("日期格式错误，请重新输入");
        return false;
    }
    var partn = /^\d{1,4}-\d{1,2}-\d{1,2}$/;
    if (!partn.exec(inputDate)) {
        alert("日期值错误，请检查");
        return false;
    }
    var year = parseInt(inputDateArr[0]);
    var month = parseInt(inputDateArr[1]);
    var day = parseInt(inputDateArr[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        alert("日期输入错误，请核对后重新输入");
        return false;
    }
    if (month < 0 || month > 12 || day < 0) {
        alert("日期输入错误，请核对后重新输入");
        return false;
    }
    if (month < 10) {
        inputDateArr[1] = "0" + month;
    }
    if (day < 10) {
        inputDateArr[2] = "0" + day;
    }
    var storeDate = inputDateArr[0] + "-" + inputDateArr[1] + "-" + inputDateArr[2];
    var flag = false;
    if ((year % 4 == 0 && year % 100 != 0) || (year % 100 == 0 && year % 400 == 0)) {
        flag = true;
    }
    if ((",1,3,5,7,8,10,12,".indexOf("," + month + ",") != -1) && (day < 32)) {
        return storeDate;
    } else if ((",4,6,9,11,".indexOf("," + month + ",") != -1) && (day < 31)) {
        return storeDate;
    } else if (day < 29) {
        return storeDate;
    } else if (flag && (day < 30)) {
        return storeDate;
    } else {
        alert("日期输入错误，请核对后重新输入");
        return false;
    }
}
/**
 * 完成task按钮的响应事件
 * 变更事件状态，并且刷新中间区域和右侧区域
 * @return {[type]} [description]
 */
function completeTask() {
    var tag = $("#task-detail").getAttribute("taskID");
    var taskValueArr = storage.getItem(tag).split(";");
    taskValueArr[2] = "1";
    var taskValue = taskValueArr.join(";");
    storage.setItem(tag, taskValue);
    //由于只是改变了完成状态，不需要更新左侧菜单，只需要更新中间列表和detail列表
    //重新初始化中间列表和detail列表
    reloadItem();
}
/**
 * 重新加载中间列表和右侧区域
 * 重置中间列表的同时就会重置detail部分了
 * @return {[type]} [description]
 */
function reloadItem() {
    var statusID = $(".task-items-header").getElementsByClassName("active-label")[0].getAttribute("id");
    var parentID = $("#task-detail").getAttribute("tag");
    var taskListIDArr = storage.getItem(parentID).split(";")[3].split(",");
    if (statusID == "select-all") {
        initTaskItemByDone(taskListIDArr, 0);
    } else if (statusID == "select-undo") {
        initTaskItemByDone(taskListIDArr, -1);
    } else {
        initTaskItemByDone(taskListIDArr, 1);
    }
    var itemList = $("#task-items-list-desc").childNodes;
    var detailTag = -1;
    if (itemList.length != 0) {
        var selectedTask = $("#task-items-list-desc").getElementsByClassName("task-title-line")[0];
        addClass(selectedTask, "active-task");
        detailTag = selectedTask.getAttribute("tag");
    }
    initTaskDetail(detailTag);
}
/**
 * 只是重新刷新detail信息，重置detail部分
 * @return {[type]} [description]
 */
function reloadDetail() {
    var detailTag = $("#task-detail").getAttribute("taskID");
    initTaskDetail(detailTag);
}
/**
 * 新增分类
 * @return {[type]} [description]
 */
function editTask() {
    initEditTask();
    editFlag = true;
}
//新增分类页面按钮事件绑定
//取消修改
$.click("#cancel-change", function() {
    var taskID = $("#task-detail").getAttribute("taskID");
    initTaskDetail(taskID);
    editFlag = false;
});
/**
 * 修改task信息，保存修改按钮的响应事件
 * 将会刷新中间列表和右侧区域
 * @return {[type]} [description]
 */
$.click("#preserve-change", function() {
    var checked = checkInput();
    if (checked) {
        preserveChange(checked);
        //变更项目后也需要重新刷新中间列表和detail的，因为会改标题和日期啊。。。
        reloadItem();
        editFlag = false;
    } else {
        return;
    }
});
/**
 * 保存修改后的task信息
 * 只是更新了存储信息中，原task对应的value值
 * @param  {[type]} msg 修改后的task信息，由task的title,date,content组成的数组
 * @return {[type]}     [description]
 */
function preserveChange(msg) {
    var taskID = $("#task-detail").getAttribute("taskID");
    var parentID = $("#task-detail").getAttribute("tag");
    var value = "2" + ";" + parentID + ";" + "0" + ";" + msg[0] + ";" + msg[1] + ";" + msg[2];
    storage.setItem(taskID, value);
}
/**
 * 添加新分类按钮的响应事件
 * 用来初始化浮层内容
 */
function addNewClass() {
    if (!alertEditStatus()) {
        return;
    }
    $(".overlay").style.display = "inline";
    $(".modal").style.display = "inline";
    initClassOptions();
    $("#new-classname").value = "";
}
//把浮层中的按钮绑定操作，放在外面，是希望，只绑定一次，而不是每次点击添加，都会绑定，就造成了重复绑定，点击一次按钮，由于多重绑定，相当于执行了多次点击，添加了多个同样的数据。
/**
 * 为浮层中取消按钮添加响应事件
 * 关闭浮层
 * @return {[type]} [description]
 */
$.click("#cancel-add-class", function() {
    $(".overlay").style.display = "none";
    $(".modal").style.display = "none";
});
/**
 * 为浮层中确定按钮添加响应事件
 * 检查输入数据，生成并存储新的菜单项，并刷新左中右所有项目
 * @return {[type]} [description]
 */
$.click("#add-new-class", function() {
    var inputClassName = $("#new-classname").value;
    if (!trim(inputClassName)) {
        alert("请输入新的分类名");
        return;
    }
    if (trim(inputClassName).length > 10) {
        alert("说好的不超过10个字符呢");
        return;
    }
    //不希望输入任何类型的分号
    if (inputClassName.indexOf(";") != -1 || inputClassName.indexOf("；") != -1) {
        alert("别输入分号啊,不好");
        return;
    }
    var className = trim(inputClassName);
    var parentID = $("#selected-parentID").value;
    var d = new Date();
    var key = "" + d.getTime();
    var value;
    if (parentID == -1) {
        value = "0;" + className + ";";
        storage.setItem(key, value);
        var rootValue = storage.getItem("root");
        rootValue = rootValue + ";" + key;
        storage.setItem("root", rootValue);
    } else {
        value = "1;" + className + ";" + parentID + ";";
        storage.setItem(key, value);
        var parentValue = trim(storage.getItem(parentID));
        var parentChild = parentValue.split(";")[2];
        //通过判断一级菜单有没有子元素，添加子元素tag时，是否需要在前面加上","
        if (parentChild.length == 0 || trim(parentChild).length == 0) {
            parentValue = parentValue + "" + key;
        } else {
            parentValue = parentValue + "," + key;
        }
        storage.setItem(parentID, parentValue);
    }
    $(".overlay").style.display = "none";
    $(".modal").style.display = "none";
    initAll();
});