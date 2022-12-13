import React, { memo, useContext, useMemo } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { useAppSelector } from "@reducers";
import { backendDeptFilterSelector } from "./reducers/slice";
import { useDeleteHrmDeptActiveMutation, useGetHrmDeptBackendIDsQuery } from "./reducers/api";
import { DialogEditContext } from ".";

const 
    DeleteDialog = memo(({deleteDialogOn}:{deleteDialogOn:boolean}) => {
        const
            filterSelector = useMemo(()=>backendDeptFilterSelector(),[]),
            filters = useAppSelector(state => filterSelector(state)),
            {count} = useGetHrmDeptBackendIDsQuery(filters,{
                selectFromResult:({currentData}) => ({
                    count: currentData ? currentData.filter(({selected})=>selected).length : 0
                })
            }),
            {dialogEditDispatch} = useContext(DialogEditContext),
            closeDialog = () => dialogEditDispatch({type:'deleteDialog',payload:false})

        return (
            <Dialog
                open={deleteDialogOn}
                onClose={closeDialog}
            >
                <DialogTitle>
                    Delete {count === 1 ? 'this department' : `these ${count} departments`}?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The deleted items cannot be recovered.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="outlined"
                        onClick={closeDialog} 
                        autoFocus
                    >Cancel</Button>
                    <DeleteButton />
                </DialogActions>
            </Dialog>
        )
    }),
    DeleteButton = memo(()=>{
        const
            [deleteItems] = useDeleteHrmDeptActiveMutation(),
            {dialogEditDispatch} = useContext(DialogEditContext),
            closeDialog = () => dialogEditDispatch({type:'deleteDialog',payload:false}),
            onClick = () => {
                deleteItems(undefined)
                closeDialog()
            }

        return (
            <Button 
                color='error' 
                variant="contained"
                onClick={onClick}
            >Delete</Button>
        )
    })

DeleteButton.displayName = 'DeleteButton'
DeleteDialog.displayName = 'DeleteDialog'
export default DeleteDialog