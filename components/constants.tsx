const constants = {
    tasksViews:['list','board'],
    taskViewLocalStorageKey:'_taskView',
    taskBoardViewSmallScreenColumnKey:'_taskBoardSmallScreenColumn',
    userRights:[
        'Rights to add / edit / delete staff members',
        'Rights to view staff details',
        'Rights to create / edit / delete projects',
        'Rights to assign tasks',
    ],
    emailRegex:/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    coworkerCSVtemplate:'https://docs.google.com/spreadsheets/d/146EPbH6vOXuObL6QDOjgjIjTurvdb1AqGqQ3IqIapIQ/edit?usp=sharing',
    avatarSize:120,
    taskBoardColumnDeleteAllTasksKey:'delete_all',
}

export default constants;