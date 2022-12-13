import React, { memo } from "react";
import List from '@mui/material/List';
import TaskTimer from "./task-timer";
import FileTransferProgress from "./file-transfer-progress";
import Mode from "./mode";
import Logout from "./logout";
import { ListItemWrapper } from "../top-sidebar-buttons";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

const BottomSidebarButtons = memo(()=>{
    return (
        <List>
            <TaskTimer />
            <FileTransferProgress />
            <ListItemWrapper {...{href:'/?page=settings',as:'/settings',title:'Settings'}}>
                <SettingsRoundedIcon fontSize='large' />
            </ListItemWrapper>
            <Mode />
            <Logout />
        </List>
    )
})
BottomSidebarButtons.displayName = 'BottomSidebarButtons'
export default BottomSidebarButtons