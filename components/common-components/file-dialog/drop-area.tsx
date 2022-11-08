import React, { ChangeEvent, memo, useRef, DragEvent, useContext } from 'react'
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material';
import { v4 as uuidv4 } from 'uuid'
import { FileDispatchContext } from '.';
import { addAction } from './reducer';

const DropArea = memo((
    {
        isLandscape
    }:{
        isLandscape:boolean
    })=>{
    const 
        {palette:{grey,text}} = useTheme(),
        {fileDispatch} = useContext(FileDispatchContext),
        dropAreaRef = useRef<HTMLDivElement>(),
        fileInputRef = useRef<HTMLInputElement>(),
        selectFileOnClick = () => fileInputRef.current.click(),
        addFiles = (files:File[]) => fileDispatch(addAction(files.map(f=>({
            id:uuidv4(),
            name:f.name,
            size:f.size,
            url:URL.createObjectURL(f),
            folder:'private' as 'private',
            mimeType:!!f.type ? f.type : '*/*',
        })))),
        fileInputOnChange = (e:ChangeEvent<HTMLInputElement>) => {
            e.preventDefault()
            e.stopPropagation()
            if (!e.target.files || e.target.files.length===0) return
            addFiles(Array.from(e.target.files))
            e.target.value = ''
        },
        handleDrop = (e:DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
            addFiles(Array.from(e.dataTransfer.files))
        },
        handleDrag = (e:DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
        }

    return (
        <Grid
            ref={dropAreaRef}
            sx={{
                ...(isLandscape 
                    ? {width:'calc(35vw - 50px)',maxHeight:'calc(80vh - 100px)',height:'350px'} 
                    : {height:'calc(40vh - 50px)'}
                ),
                border:`0.25rem dashed ${grey[500]}`,
                borderRadius:5,
                justifyContent:'center'
            }}
            container
            direction='column'
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <Stack
                direction='column'
                spacing={1}
            >
                <Typography
                    align='center'
                    sx={{
                        fontWeight:'bold',
                        color:text.secondary,
                        letterSpacing:'0.05rem',
                        px:2
                    }}
                >DROP THE FILES HERE</Typography>
                <Typography
                    align='center'
                    sx={{color:text.secondary}}
                >OR</Typography>
                <Grid
                    container
                    direction='row'
                    sx={{
                        justifyContent:'center'
                    }}
                >
                    <Button
                        disableRipple
                        disableFocusRipple
                        disableTouchRipple
                        sx={{
                            pt:0.5,
                            fontSize:'0.8rem',
                            letterSpacing:'0.03rem',
                            fontWeight:'bold',
                            '&:hover':{
                                backgroundColor:'transparent',
                                textDecoration:'underline',
                                textUnderlineOffset:'0.2rem',
                            }
                        }}
                        onClick={selectFileOnClick}
                    >SELECT FILES</Button>
                </Grid>
            </Stack>
            <input type='file' multiple accept='*/*' hidden ref={fileInputRef} onChange={fileInputOnChange} />
        </Grid>
    )
})
DropArea.displayName = 'DropArea'
export default DropArea