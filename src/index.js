import ReactDOM from 'react-dom'
import React from 'react'
import { mean } from 'lodash'
import * as d3 from 'd3'
import { Spring, animated } from 'react-spring'
import './styles.css'

const BASE_WIDTH = 400
const BASE_HEIGHT = 400
const NUM_BARS = 25
const BAR_ANGLE = (2 * Math.PI) / NUM_BARS
const INNER_RADIUS = 20
const MAX_RADIUS = BASE_WIDTH / 2
const DOMAIN = [0, 100]

export default class Chart extends React.Component {
  state = { flipped: false }
  click = () => {
    this.setState(state => ({ flipped: !state.flipped }))
  }
  componentWillMount() {
    // first build a "layout", which in a d3 context means:
    // a function that takes in some data and gives us
    // drawing instructions - here, in the form of an SVG path
    // commands string
    this.layout = d3
      .arc()
      .startAngle(d => d.i * BAR_ANGLE)
      .endAngle(d => (d.i + 1) * BAR_ANGLE)
      .innerRadius(INNER_RADIUS)

    // we'll use a scale to match values from the domain
    // to a certain range (expressed in pixels)
    this.scale = d3
      .scaleLinear()
      .domain(DOMAIN)
      .range([INNER_RADIUS, MAX_RADIUS])
  }
  render() {
    const { flipped } = this.state
    const dataset = flipped === true ? this.props.dataset2 : this.props.dataset1
    const overallScore = mean(dataset)

    return (
      <div>
        <svg onClick={this.click} style={{ width: BASE_WIDTH, height: BASE_HEIGHT }}>
          <g style={{ transform: `translate(${BASE_WIDTH / 2}px, ${BASE_HEIGHT / 2}px)` }}>
            <circle r={MAX_RADIUS} stroke="rgba(0, 0, 0, .2)" fill="none" />
            {dataset.map((d, i) => {
              // Compute the outer radius of each bar using the pre-generated scale
              // We must make sure our path always has the same number of points,
              // or else Spring's interpolator will fail - we do that by avoiding
              // having "zero" values render to a bar, ie this radius must always
              // be > to innerRadius.
              const outerRadius = Math.max(INNER_RADIUS + 0.1, this.scale(d))

              // Send the current index as the data, as well
              // as the calculated outerRadius, which is a method of d3.arc
              const path = this.layout({ i, outerRadius })

              // Generate a color for each frame of the animation using a preset
              // color scale
              const color = d3.interpolateRdYlGn(d / 100)

              const targetStyle = {
                path,
                color
              }

              return (
                // Here we use the actual Spring component, which is uses a render prop -see
                // https://reactjs.org/docs/render-props.html
                // Here, we have Spring calculate each property of targetStyle, for each
                // frame of the animation - frameStyle is the resulting "temporary" object,
                // mimicking the properties present in targetStyle.
                // Note the delay argument which we use to stagger the animation of the bars.
                <Spring key={i} native delay={i * 50} to={targetStyle}>
                  {frameStyle => {
                    return <animated.path d={frameStyle.path} fill={frameStyle.color} />
                  }}
                </Spring>
              )
            })}
            <text transform="translate(-9, 5)">
              <Spring key="text" to={{ overallScore }}>
                {frameStyle =>
                  // Did I mention Spring can also interpolate text nodes?
                  Math.round(frameStyle.overallScore)
                }
              </Spring>
            </text>
          </g>
        </svg>
      </div>
    )
  }
}

const dataset1 = [0, 94, 92, 95, 40, 78, 77, 99, 90, 50, 10, 88, 82, 15, 20, 40, 10, 41, 15, 28, 38, 87, 90, 98, 66]
const dataset2 = [100, 95, 90, 80, 70, 60, 60, 65, 98, 40, 30, 35, 80, 25, 55, 66, 92, 67, 10, 37, 59, 88, 80, 90, 76]

ReactDOM.render(<Chart dataset1={dataset1} dataset2={dataset2} />, document.getElementById('root'))
