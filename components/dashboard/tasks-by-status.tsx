import { capitalizeSingleWord, interpolateColorString } from "@components/functions";
import { taskApprovalItemSelector, taskSelector } from "@components/tasks/reducers/slice";
import { useTheme } from "@mui/material";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ItemWrapper from "./item-wrapper";
import Box from '@mui/material/Box'
import { BlankMessage } from "@components/common-components";
import { Task } from "@components/tasks/interfaces";

const TasksByStatus = () => {
    const
        chartDiv = useRef<HTMLDivElement>(),
        container = useRef<HTMLDivElement>(),
        chart = useRef<google.visualization.BarChart>(),
        googleChartLoaded = useAppSelector(state => state.misc.googleChartLoaded),
        {palette:{primary,error,grey,mode,text,background}} = useTheme(),
        firstRow = useRef([
            'Status',
            'Count',
            {role:'style'},
            {role:'tooltip',p:{html:true}}
        ]).current,
        chartDataSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                const 
                    uid = state.misc.uid,
                    tasks = taskSelector.selectAll(state).filter(e=>e.owner===uid)
                    
                if (!tasks.length) return [firstRow]

                const 
                    taskApprovals = Array.from(new Set(tasks.map(e=>e.approval))),
                    rows = taskApprovalItemSelector.selectAll(state)
                        .filter(e=>taskApprovals.includes(e.id))
                        .sort((a,b)=>!a ? 0 : a.id > b.id ? 1 : -1)
                        .map(e=>{
                            const count = tasks.filter(t=>t.approval===e.id).length
                            return [
                                e.name.split(' ').map(e=>capitalizeSingleWord(e)).join(' '),
                                count,
                                interpolateColorString(error.main,primary.main,+e.id),
                                `
                                    <div style='width:max-content;padding:8px;background-color:${background.paper}'>
                                        <p style='text-transform:capitalize;margin:0px;color:${text.primary};'>
                                            ${e.name}: <span style='font-weight:bold'>${count}</span>
                                        </p>
                                    </div>
                                `
                            ]
                        })
                return [firstRow,...rows]
            }
        ),[text.primary,background.paper]),
        chartData = useAppSelector(state => chartDataSelector(state)),
        hAxisTicksSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskApprovalItemSelector.selectAll(state).map(e=>e.id),
            (state:ReduxState)=>taskSelector.selectAll(state).filter(e=>e.owner===state.misc.uid),
            (approvalStatuses:EntityId[],tasks:Task[])=>{
                if (!tasks.length) return []
                const 
                    distribution = approvalStatuses.map(e=>tasks.filter(t=>t.approval===e).length),
                    largestCount = Math.max(...distribution)
                if (largestCount <= 5) return Array.from(Array(largestCount).keys(),e=>e+1)
                const factor = Math.ceil(largestCount / 5)
                return Array.from(Array(5).keys(),e=>(e+1) * factor)
            }
        ),[]),
        hAxisTicks = useAppSelector(state => hAxisTicksSelector(state)),
        [show,setShow] = useState(false),
        drawChart = () => {
            chart.current.clearChart()

            const
                data = google.visualization.arrayToDataTable(chartData),
                view = new google.visualization.DataView(data),
                containerWidth = container.current?.getBoundingClientRect()?.width || 0

            chart.current.draw(view,{
                width:containerWidth,
                height:chartData.length * 50,
                chartArea:{
                    width:!!containerWidth ? containerWidth - 100 : 0,
                    right:25,
                    top:15,
                    bottom:35,
                },
                legend: {
                    position: "none",
                },
                backgroundColor:'transparent',
                hAxis:{
                    gridlines:{
                        count:10,
                        color:grey[500]
                    },
                    minorGridlines:{
                        color:grey[mode==='light' ? 200 : 800],
                    },
                    baselineColor:grey[500],
                    textStyle:{
                        color:text.primary
                    },
                    ...(!!hAxisTicks.length && {ticks:hAxisTicks})
                },
                vAxis:{
                    textStyle:{
                        color:text.primary,
                        fontSize:Math.round(+window.getComputedStyle(document.body).fontSize.replace('px','') * 0.75)
                    }
                },
                tooltip:{
                    isHtml:true
                }
            })
        }

    useEffect(()=>{
        if (show) {
            drawChart()
            window.addEventListener('resize',drawChart,{passive:true})
        }
        return () => {
            if (!!chart.current) window.removeEventListener('resize',drawChart)
        }
    },[show])

    useEffect(()=>{
        if (googleChartLoaded) {
            if (!chart.current) chart.current = new google.visualization.BarChart(chartDiv.current)
            setShow(chartData.length > 1)
        }
    },[googleChartLoaded,chartData])

    return (
        <ItemWrapper title='Tasks by Status' ref={container}>
            <>
            <Box 
                ref={chartDiv} 
                sx={{display:show ? 'block' : 'none'}}
            />
            {!show && <BlankMessage text='Currently you own no task.' />}
            </>
        </ItemWrapper>
    )
}

export default TasksByStatus