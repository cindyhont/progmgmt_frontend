import React, { memo, useContext } from "react";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Dialog from "@mui/material/Dialog";
import { DialogCtxMenuDispatchContext } from "../contexts";
import { toggleDialogAction } from "../reducers/dialog-ctxmenu-status";
import DialogContentText from '@mui/material/DialogContentText';
import Link from '@mui/material/Link';

const VisitorNoticeParentSearch = memo(({open}:{open:boolean})=>{
    const
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'visitorNoticeParentSearch',open:false}))
        
    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogContent>
                <DialogContentText>
                    As a visitor, you can only search tasks owned by users in your chat list.
                </DialogContentText>
                <Link href='/chat' target='_blank'>Add more users in chat app</Link>
                <DialogActions>
                    <Button variant='contained' onClick={onClose}>OK</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
})
VisitorNoticeParentSearch.displayName = 'VisitorNoticeParentSearch'
export default VisitorNoticeParentSearch