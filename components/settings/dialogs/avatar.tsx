import React, { memo, Touch as ReactTouch, TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState, SyntheticEvent } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from "@mui/material/DialogActions";
import { getImageFromURL } from '@components/functions';
import constants from '@components/constants';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { useUdpateAvatarMutation } from '../reducers/api';
import Typography from '@mui/material/Typography'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import useWindowEventListeners from '@hooks/event-listeners/window';

const 
    AvatarDialog = memo((
        {
            avatarTempUrl,
            onClose,
        }:{
            avatarTempUrl:string;
            onClose:()=>void;
        }
    )=>{
        const
            round = useRef(Math.round).current,
            min = useRef(Math.min).current,
            max = useRef(Math.max).current,
            containerRef = useRef<HTMLDivElement>(),
            [loading,setLoading] = useState(false),
            [showError,setShowError] = useState(false),
            [sliderValue,setSliderValue] = useState(0),
            [sliderMax,setSliderMax] = useState(100),
            [showSlider,setShowSlider] = useState(true),
            zoomOutOnClick = () => setSliderValue(prev => max(0,prev - 1)),
            zoomInOnClick = () => setSliderValue(prev => min(sliderMax,prev + 1)),
            sliderOnChange = (_:Event,e:number) => setSliderValue(e),
            [open,setOpen] = useState(false),
            dpr = useRef(Math.floor(min(window.devicePixelRatio,2))).current,
            imgRef = useRef<HTMLImageElement>(),
            canvasRef = useRef<HTMLCanvasElement>(),
            originalImgSize = useRef({w:0,h:0}),
            currentImgSize = useRef({w:0,h:0}),
            minImgSize = useRef({w:0,h:0}),
            canvasSize = useRef({w:0,h:0}),
            center = useRef({x:0,y:0}),
            cursor = useRef({x:-1,y:-1}),
            moving = useRef(false),
            handleClose = () => {
                setOpen(false)
                imgRef.current = null
                onClose()
                setSliderValue(0)
            },
            maxCanvasSize = useRef(200).current,
            init = () => {
                canvasSize.current = {w:min(window.innerWidth - 112,maxCanvasSize),h:maxCanvasSize}
                canvasRef.current.style.width = `${canvasSize.current.w}px`
                canvasRef.current.style.height = `${canvasSize.current.h}px`
                canvasRef.current.width = canvasSize.current.w * dpr
                canvasRef.current.height = canvasSize.current.h * dpr
            },
            paintImage = () => {
                const ctx = canvasRef.current.getContext('2d')

                ctx.clearRect(0,0,canvasSize.current.w * dpr,canvasSize.current.h * dpr)

                ctx.drawImage(
                    imgRef.current,
                    0,
                    0,
                    originalImgSize.current.w,
                    originalImgSize.current.h,
                    round((canvasSize.current.w * 0.5 - center.current.x) * dpr),
                    round((canvasSize.current.h * 0.5 - center.current.y) * dpr),
                    currentImgSize.current.w * dpr,
                    currentImgSize.current.h * dpr,
                )
            },
            addFrame = () => {
                const ctx = canvasRef.current.getContext('2d')

                const rectangle = new Path2D()
                rectangle.rect(0, 0, canvasSize.current.w * dpr, canvasSize.current.h * dpr)

                const circle = new Path2D()
                circle.arc(round(canvasSize.current.w * dpr * 0.5),round(canvasSize.current.h * dpr * 0.5),round(constants.avatarSize * dpr * 0.5),0,2 * Math.PI)

                rectangle.addPath(circle)
                ctx.fillStyle = 'rgba(0,0,0,0.5)'
                ctx.fill(rectangle,'evenodd')
            },
            initNewCanvas = async() => {
                setLoading(false)
                setShowError(false)
                imgRef.current = await getImageFromURL(avatarTempUrl)
                const 
                    imgW = imgRef.current.width,
                    imgH = imgRef.current.height,
                    srcW = imgW > imgH ? round(imgW * constants.avatarSize / imgH) : constants.avatarSize,
                    srcH = imgW > imgH ? constants.avatarSize : round(imgH * constants.avatarSize / imgW)

                originalImgSize.current = {w:imgW,h:imgH}
                currentImgSize.current = {w:srcW,h:srcH}
                minImgSize.current = {w:srcW,h:srcH}
                center.current = {x:srcW * 0.5,y:srcH * 0.5}

                if (min(imgW,imgH) > constants.avatarSize){
                    setShowSlider(true)
                    setSliderValue(0)
                    setSliderMax(min(100,imgW - constants.avatarSize,imgH - constants.avatarSize))
                } else setShowSlider(false)

                paintImage()
                addFrame()

                setOpen(true)
            },
            onResize = () => {
                init()
                if (!!imgRef.current) {
                    paintImage()
                    addFrame()
                }
            },
            movtStart = (e:ReactTouch|ReactMouseEvent) => {
                moving.current = true
                cursor.current = {x:e.clientX,y:e.clientY}
            },
            onTouchStart = (e:ReactTouchEvent) => {
                if (e.touches.length !== 1) return
                movtStart(e.touches[0])
            },
            onMovtEnd = () => {
                if (!moving.current) return
                moving.current = false
                cursor.current = {x:-1,y:-1}
            },
            recalculateCenter = (x:number,y:number) => {
                center.current = {
                    x:min(max(x,constants.avatarSize * 0.5),currentImgSize.current.w - constants.avatarSize * 0.5),
                    y:min(max(y,constants.avatarSize * 0.5),currentImgSize.current.h - constants.avatarSize * 0.5)
                }
            },
            onMovement = (e:MouseEvent|Touch) => {
                const {clientX,clientY} = e
                recalculateCenter(
                    center.current.x - clientX + cursor.current.x,
                    center.current.y - clientY + cursor.current.y
                )
                cursor.current = {x:clientX,y:clientY}
                paintImage()
                addFrame()
            },
            onMouseMovement = (e:MouseEvent) => {
                if (!moving.current) return
                e.preventDefault()
                onMovement(e)
            },
            onTouchMovement = (e:TouchEvent) => {
                if (!moving.current) return
                e.preventDefault()
                onMovement(e.touches.item(0))
            },
            sliderValueOnUpdate = () => {
                const
                    centerX = center.current.x / currentImgSize.current.w,
                    centerY = center.current.y / currentImgSize.current.h
                currentImgSize.current = {
                    w:round((originalImgSize.current.w - minImgSize.current.w) * sliderValue / sliderMax + minImgSize.current.w),
                    h:round((originalImgSize.current.h - minImgSize.current.h) * sliderValue / sliderMax + minImgSize.current.h),
                }
                recalculateCenter(round(centerX * currentImgSize.current.w),round(centerY * currentImgSize.current.h))
                paintImage()
                addFrame()
            },
            [updateAvatar] = useUdpateAvatarMutation(),
            onSubmit = async() => {
                setLoading(true)
                setShowError(false)

                const 
                    img = await fetch(avatarTempUrl),
                    blob = await img.blob(),
                    type = blob.type,
                    canvas = document.createElement('canvas')

                canvas.width = constants.avatarSize * 2
                canvas.height = constants.avatarSize * 2

                const ctx = canvas.getContext('2d')

                ctx.drawImage(
                    imgRef.current,
                    0,
                    0,
                    originalImgSize.current.w,
                    originalImgSize.current.h,
                    round(constants.avatarSize - center.current.x * 2),
                    round(constants.avatarSize - center.current.y * 2),
                    currentImgSize.current.w * 2,
                    currentImgSize.current.h * 2,
                )

                const 
                    avatar = canvas.toDataURL(type,0.7),
                    {success} = await updateAvatar(avatar).unwrap() as {success:boolean}

                if (success) handleClose()
                else setShowError(true)

                setLoading(false)
            }

        useEffect(()=>{
            setTimeout(init,1)
        },[])

        useWindowEventListeners([
            {evt:'resize',func:onResize},
            {evt:'mousemove',func:onMouseMovement},
            {evt:'mouseup',func:onMovtEnd},
            {evt:'touchmove',func:onTouchMovement},
            {evt:'touchend',func:onMovtEnd},
            {evt:'touchcancel',func:onMovtEnd},
        ])

        useEffect(()=>{
            if (!!avatarTempUrl) initNewCanvas()
        },[avatarTempUrl])

        useEffect(()=>{
            if (open) sliderValueOnUpdate()
        },[sliderValue])

        return (
            <Dialog open={open} onClose={handleClose} keepMounted>
                <DialogTitle>Upload Avatar</DialogTitle>
                <DialogContent ref={containerRef}>
                    <canvas 
                        ref={canvasRef} 
                        onMouseDown={movtStart}
                        onTouchStart={onTouchStart}
                    />
                    <Stack direction='row' spacing={1} alignItems='center' sx={{display:showSlider ? 'flex' : 'none'}}>
                        <Tooltip title='Zoom Out'>
                            <IconButton onClick={zoomOutOnClick}>
                                <RemoveRoundedIcon />
                            </IconButton>
                        </Tooltip>
                        <Slider value={sliderValue} onChange={sliderOnChange} max={sliderMax} />
                        <Tooltip title='Zoom In'>
                            <IconButton onClick={zoomInOnClick}>
                                <AddRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    {showError && <Typography color='error'>Connection error. Please try again later.</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button {...{
                        variant:'contained',
                        ...(loading && {endIcon:<RefreshRoundedIcon className="infinite-rotate" />}),
                        onClick:onSubmit
                    }} >Submit</Button>
                </DialogActions>
            </Dialog>
        )
    })
AvatarDialog.displayName = 'AvatarDialog'
export default AvatarDialog