import React, { memo } from "react";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Drawer from '@mui/material/Drawer';
import { useAppSelector } from "@reducers";
import { SxProps, Theme } from "@mui/material/styles";

const DrawerCommon = memo((
    {
        children,
        open,
        onClose,
        onOpen,
        sx,
        anchor,
    }:{
        children:JSX.Element;
        open:boolean;
        onClose:()=>void;
        onOpen:()=>void;
        sx?:SxProps<Theme>;
        anchor?:"bottom" | "left" | "right" | "top";
    }
)=>{
    const isTouchScreen = useAppSelector(state => state.misc.isTouchScreen)
    
    if (isTouchScreen) return (
        <SwipeableDrawer
            {...{
                open,
                onClose,
                onOpen,
                sx,
                anchor,
            }}
        >
            {children}
        </SwipeableDrawer>
    )
    return (
        <Drawer
            {...{
                open,
                onClose,
                sx,
                anchor,
            }}
        >
            {children}
        </Drawer>
    )
})
DrawerCommon.displayName = 'DrawerCommon'
export default DrawerCommon