import { DialogCtxMenuDispatchContext } from "@components/tasks/contexts";
import { toggleDialogAction } from "@components/tasks/reducers/dialog-ctxmenu-status";
import { useTheme } from "@mui/material";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React, { useContext } from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import MenuList from '@mui/material/MenuList';

const TaskDetailsAppBarMenu = (
    {
        anchor,
        open,
        onClose,
    }:{
        anchor:HTMLElement;
        open:boolean;
        onClose:()=>void;
    }
) => {
    const
        {palette:{error}} = useTheme(),
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        renameOnClick = () => {
            onClose()
            dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'renameTask',open:true}))
        },
        deleteOnClick = () => {
            onClose()
            dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteTask',open:true}))
        }

    return (
        <Menu
            open={open}
            onClose={onClose}
            keepMounted
            anchorEl={anchor}
        >
            <MenuItem onClick={renameOnClick}>
                <ListItemIcon>
                    <EditRoundedIcon />
                </ListItemIcon>
                <ListItemText>Rename Task</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={deleteOnClick}>
                <ListItemIcon>
                    <DeleteRoundedIcon color='error' />
                </ListItemIcon>
                <ListItemText sx={{color:error.main}}>Delete Task</ListItemText>
            </MenuItem>
        </Menu>
    )
}

export default TaskDetailsAppBarMenu