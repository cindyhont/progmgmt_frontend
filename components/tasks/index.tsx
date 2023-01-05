import { useAppSelector } from '@reducers';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { DialogCtxMenuStateContext } from './contexts';
import AddBoardColumnDialog from './dialogs/add-board-column';
import { AddTaskDialog } from './dialogs/add-edit-task';
import ContextMenu from './dialogs/context-menu';
import { AddCustomFieldDialog, EditCustomFieldDialog } from './dialogs/custom-field';
import DeleteBoardColumnDialog from './dialogs/delete-board-column';
import DeleteFieldDialog from './dialogs/delete-field';
import DeleteTaskDialog from './dialogs/delete-task';
import EditPeopleFieldDialog from './dialogs/edit-people-field';
import EditTaskApproval from './dialogs/edit-task-approval';
import EditTaskLinkDialog from './dialogs/edit-task-link-field';
import EditTaskTagsField from './dialogs/edit-task-tag-field';
import ListColumnDialog from './dialogs/list-columns';
import RenameBoardColumnDialog from './dialogs/rename-board-column';
import RenameTaskDialog from './dialogs/rename-task';
import VisitorNoticeParentSearch from './dialogs/visitor-notice-parent-search';
import TaskPageContent from './task-page-content';

const 
    Tasks = ()=>{
        const 
            onDragOver = (e:DragEvent) => e.preventDefault(),
            taskID = useRouter().query.taskid as string,
            isVisitor = useAppSelector(state => state.misc.visitor)

        useEffect(()=>{
            window.addEventListener('dragover',onDragOver,{passive:false})
            return () => window.removeEventListener('dragover',onDragOver)
        },[])
        
        return (
            <DialogCtxMenuStateContext.Consumer>{state=>
                <>
                <TaskPageContent />
                {!taskID && <AddTaskDialog open={state.addTask} addTaskDefaultObj={state.addTaskDefaultObj} />}
                <AddCustomFieldDialog open={state.addCustomField} />
                <EditCustomFieldDialog open={state.editCustomField} />
                <ListColumnDialog open={state.editListViewColumns} />
                <AddBoardColumnDialog open={state.addBoardColumn} />
                <ContextMenu {...{open:state.contextMenu,anchorPosition:state.contextMenuPosition}} />
                <RenameBoardColumnDialog {...{open:state.renameBoardColumn}} />
                <DeleteBoardColumnDialog {...{open:state.deleteBoardColumn}} />
                <RenameTaskDialog {...{open:state.renameTask}} />
                <DeleteTaskDialog {...{open:state.deleteTask}} />
                <EditPeopleFieldDialog />
                <EditTaskLinkDialog />
                <EditTaskTagsField />
                <EditTaskApproval />
                <DeleteFieldDialog {...{open:state.deleteField}} />
                {isVisitor && <VisitorNoticeParentSearch open={state.visitorNoticeParentSearch} />}
                </>
            }</DialogCtxMenuStateContext.Consumer>
        )
    }

export default Tasks