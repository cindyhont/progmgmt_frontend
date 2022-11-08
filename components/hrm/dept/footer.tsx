import React, { ChangeEvent, useMemo } from "react";
import { useTheme } from '@mui/material/styles';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import { useAppDispatch, useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import { useGetHrmDeptBackendIDsQuery } from "./reducers/api";
import AllCheckBox from "./all-checkbox";
import { backendDeptFilterSelector, updatePage, updateRowsPerPage } from "./reducers/slice";
import { deptRowsPerPageOptions as rowsPerPageOptions } from '../functions'

const
    Footer = ()=>{
        const theme = useTheme()
            
        return (
            <TableFooter
                sx={{
                    position:'sticky',
                    insetBlockEnd:'0',
                    backgroundColor:theme.palette.background.default,
                    zIndex:'1'
                }}
            >
                <TableRow>
                    <AllCheckBox />
                    <Pagination />
                </TableRow>
            </TableFooter>
        )
    },
    Pagination = ()=>{
        const 
            dispatch = useAppDispatch(),
            filterSelector = useMemo(()=>backendDeptFilterSelector(),[]),
            filters = useAppSelector(state => filterSelector(state)),
            {totalCount} = useGetHrmDeptBackendIDsQuery(filters,{
                selectFromResult:({data}) => ({
                    totalCount:!!data ? data.length : 0
                })
            }),
            rowsPerPage = useAppSelector(state=>state.hrmDept.limit,shallowEqual),
            page = useAppSelector(state=>state.hrmDept.page,shallowEqual),
            handleChangePage = (_e:any,newPage:number) => dispatch(updatePage(newPage)),
            handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => dispatch(updateRowsPerPage(+e.target.value))

        return (
            <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                showFirstButton
                showLastButton
                labelRowsPerPage='Rows:'
                sx={{py:0}}
            />
        )
    }

export default Footer