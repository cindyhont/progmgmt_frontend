import React, { memo } from "react"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import { useAppSelector } from "@reducers"
import { EntityId } from "@reduxjs/toolkit"
import { googleFileSelector } from "@reducers/google-download-api/slice"
import { useNewGoogleDownloadMutation } from "@reducers/google-download-api"
import { googleFilePrelimSelector } from "@reducers/google-upload-api/slice"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import LinearProgress from '@mui/material/LinearProgress';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import TaskRoundedIcon from '@mui/icons-material/TaskRounded';
import { getFileSizeString } from "../functions"
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

const
    FileDownload = (
        {
            id,
            inChat,
            dataset,
            backgroundColor
        }:{
            id:EntityId;
            inChat:boolean;
            dataset?:{[k:string]:string};
            backgroundColor?:string;
        }
    ) => {
        const 
            name = useAppSelector(state => googleFileSelector.selectById(state,id)?.name || ''),
            size = useAppSelector(state => googleFileSelector.selectById(state,id)?.size || 0),
            downloading = useAppSelector(state => googleFileSelector.selectById(state,id)?.downloading || false),
            progress = useAppSelector(state => googleFileSelector.selectById(state,id)?.progress || 0),
            [startDownload] = useNewGoogleDownloadMutation(),
            onClick = () => {
                if (downloading) return
                startDownload({id,name,size,downloading:false,progress:0,url:'',error:false})
            }
        
        return <File {...{
            cursor:downloading ? 'default' : 'pointer',
            iconDownload:true,
            inChat,
            fileName:name,
            visible:downloading,
            progress,
            fileSize:size,
            onClick,
            dataset,
            backgroundColor,
        }} />
    },
    FileUpload = (
        {
            id,
            inChat,
            dataset,
            backgroundColor,
        }:{
            id:EntityId;
            inChat:boolean;
            dataset?:{[k:string]:string};
            backgroundColor?:string;
        }
    ) => {
        const 
            fileName = useAppSelector(state => googleFilePrelimSelector.selectById(state,id)?.fileName || ''),
            fileSize = useAppSelector(state => googleFilePrelimSelector.selectById(state,id)?.fileSize || 0),
            uploaded = useAppSelector(state => googleFilePrelimSelector.selectById(state,id)?.uploaded || 0)

        return <File {...{
            cursor:'default',
            iconDownload:false,
            inChat,
            fileName,
            visible:true,
            progress:uploaded,
            fileSize,
            onClick:()=>{},
            dataset,
            backgroundColor,
        }} />
    },
    File = (
        {
            cursor,
            iconDownload,
            inChat,
            fileName,
            visible,
            progress,
            fileSize,
            onClick,
            dataset,
            backgroundColor,
        }:{
            cursor:'pointer'|'default';
            iconDownload:boolean;
            inChat:boolean;
            fileName:string;
            visible:boolean;
            progress:number;
            fileSize:number;
            onClick:()=>void;
            dataset?:{[k:string]:string};
            backgroundColor?:string;
        }
    ) => (
        <Grid
            sx={{cursor}}
            onClick={onClick}
            {...dataset}
        >
            <Table
                sx={{
                    backgroundColor:!!backgroundColor ? backgroundColor : 'rgba(255,255,255,0.2)',
                    borderRadius:2
                }}
            >
                <TableBody>
                    <TableRow>
                        <TableCell sx={{width:'0px',border:'none',mx:0,my:1,px:1,py:0}}>
                            <Grid container direction='column'>
                                {inChat ? iconDownload ? <TaskRoundedIcon /> : <UploadFileRoundedIcon /> : iconDownload ? <DownloadRoundedIcon /> : <UploadRoundedIcon />}
                            </Grid>
                        </TableCell>
                        <TableCell sx={{border:'none',display:'grid',mx:0,my:0.5,pl:0,pr:1,py:0}}>
                            <Typography
                                sx={{
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                    fontSize:'0.9rem',
                                    fontWeight:'bold'
                                }}
                            >{fileName}</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={100 * progress / fileSize} 
                                sx={{
                                    my:0,
                                    borderRadius:'100px',
                                    visibility:visible ? 'visible' : 'hidden'
                                }}
                            />
                            <Typography 
                                sx={{
                                    textAlign:'right',
                                    fontSize:'0.75rem',
                                    fontStyle:'italic',
                                }}
                            >{visible ? `${getFileSizeString(progress)} / ${getFileSizeString(fileSize)}` : getFileSizeString(fileSize)}</Typography>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Grid>
    ),
    FileDivertComponent = memo((
        {
            id,
            inChat,
            dataset,
            backgroundColor,
        }:{
            id:EntityId;
            inChat:boolean;
            dataset?:{[k:string]:string}
            backgroundColor?:string;
        }
    ) => {
        const file = useAppSelector(state => googleFileSelector.selectById(state,id))
        return !!file ? <FileDownload {...{id,inChat,dataset,backgroundColor}} /> : <FileUploadCheck {...{id,inChat,dataset,backgroundColor}} />
    }),
    FileUploadCheck = (
        {
            id,
            inChat,
            dataset,
            backgroundColor,
        }:{
            id:EntityId;
            inChat:boolean;
            dataset?:{[k:string]:string}
            backgroundColor?:string;
        }
    ) => {
        const 
            googleFileID = useAppSelector(state => googleFilePrelimSelector.selectById(state,id)?.googleFileID || ''),
            downloadable = useAppSelector(state => !!googleFileSelector.selectById(state,googleFileID))
            
        return downloadable ? <FileDownload {...{id:googleFileID,inChat,dataset,backgroundColor}} /> : <FileUpload {...{id,inChat,dataset,backgroundColor}} />
    }

FileDivertComponent.displayName = 'FileDivertComponent'
export {
    FileDownload,
    FileUpload,
    FileDivertComponent,
}