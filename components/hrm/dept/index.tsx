import React, { createContext, Dispatch, memo, useMemo, useReducer } from "react";
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import Header from "./header";
import Body from "./body";
import Footer from "./footer";
import FilterModal from "./filter-modal";
import AddDeptDialog from "./add-dept-dialog";
import DeleteDialog from "./delete-dialog";
import { useAppSelector } from "@reducers";
import { useGetHrmDeptFrontendListQuery } from "./reducers/api";
import Skeleton from "@mui/material/Skeleton";
import DeptSpeedDial from './speeddial'
import { frontendDeptFilterSelector } from "./reducers/slice";
import { initialState, ItoggleFilterAction, reducer } from "./reducers/dialog-edit-status";

const 
    DialogEditContext = createContext<{dialogEditDispatch:Dispatch<ItoggleFilterAction>}>({dialogEditDispatch:()=>{}}),
    EditModeContext = createContext<{editMode:boolean}>({editMode:false}),
    Departments = memo(() => {
        const [state,dialogEditDispatch] = useReducer(reducer,initialState)
        return (
            <Grid
                item
                md={9}
                xs={12}
                sx={{margin:'auto'}}
            >
                <TableContainer
                    sx={{
                        maxHeight: 'calc(var(--viewport-height) - 180px)',
                        '& .MuiTableCell-head':{
                            py:0.3
                        },
                    }}
                >
                    <DialogEditContext.Provider value={{dialogEditDispatch}} >
                        <EditModeContext.Provider value={{editMode:state.editMode}}>
                            <TableResult />
                        </EditModeContext.Provider>
                    </DialogEditContext.Provider>
                </TableContainer>
                <DialogEditContext.Provider value={{dialogEditDispatch}} >
                    <FilterModal filterOn={state.filter} />
                    <AddDeptDialog addDialogOn={state.addDialog} />
                    <DeleteDialog deleteDialogOn={state.deleteDialog} />
                    <EditModeContext.Provider value={{editMode:state.editMode}}>
                        <DeptSpeedDial />
                    </EditModeContext.Provider>
                </DialogEditContext.Provider>
            </Grid>
        )
    }),
    TableResult = memo(() => {
        const 
            filterSelector = useMemo(()=>frontendDeptFilterSelector(),[]),
            filters = useAppSelector(state=>filterSelector(state)),
            {isLoading} = useGetHrmDeptFrontendListQuery(filters)

        if (isLoading) return (
            <>
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
                <Skeleton height={40} animation='wave' sx={{mb:2}} />
            </>
        )
        return <TableLoaded />
    }),
    TableLoaded = memo(() => (
        <Table stickyHeader>
            <Header />
            <Body />
            <Footer />
        </Table>
    ))

Departments.displayName = 'Departments'
TableLoaded.displayName = 'TableLoaded'
TableResult.displayName = 'TableResult'
export default Departments;
export { DialogEditContext, EditModeContext }