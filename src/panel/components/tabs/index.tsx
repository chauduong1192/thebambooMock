import * as React from "react";
import styled from "styled-components";
import media from "styled-media-query";
import { Text } from 'rebass';
import { Icon } from "../table";

interface IProps {
  selected: number;
  tabs: string[];
  tabWidth?: number;
  className?: string;
  onChange: (selected: number) => void;
}

const Wrapper = styled("div")`
  display: flex;
  background: ${({ theme }) => theme.colors.white};
`;

const TabIcon = styled(Icon)`
  ${media.lessThan("medium")`
    & div {
      display: none;
    }
  `}
`;

const TabWrapper = styled("div") <{ active?: boolean }>`
  padding: 4px 8px;
  display: flex;
  align-items: center;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  ${({ theme, active }) =>
    active &&
    `
      border-bottom: 3px solid ${theme.colors.primary};
      background: white;
    
    `};

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }
`;

const Tabs = ({ selected, tabs, tabWidth, className, onChange }: IProps) => (
  <Wrapper className={`tabs ${className ? className : ""}`}>
    {tabs.map((tab, index) => (
      <TabWrapper
        key={index}
        style={{ width: tabWidth }}
        active={selected === index}
        onClick={() => onChange(index)}
      >
        <TabIcon color="primary">{tab === 'Mocks' ? 'api' : 'loyalty'}</TabIcon>
        <Text ml={['0', '4px']} display={['none', 'block']}>{tab}</Text>
      </TabWrapper>
    ))}
  </Wrapper>
);

export default Tabs;
