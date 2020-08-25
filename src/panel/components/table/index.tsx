import styled from "styled-components";
import media from "styled-media-query";
import { ThemeType } from "../../theme";

export const Cell = styled.td<{ width?: number }>`
  ${({ width }) => width && `width: ${width}px`};
  text-align: left;
  padding-right: 8px;
  &:first-child {
    padding-left: 8px;
  }
  > div {
    padding: 8px 0;
  }
`;

export const HeaderCell = styled.th<{ width?: number }>`
  ${({ width }) => width && `width: ${width}px`};
  text-align: left;
  &:first-child {
    padding-left: 8px;
  }
  > div {
    padding: 8px 0;
  }
`;

export const Table = styled.table`
  width: 100%;
  table-layout: fixed;
  overflow-wrap: break-word;
  border-spacing: 0;
`;

export const TableRow = styled.tr`
  cursor: pointer;
`;

export const TableBodyWrapper = styled.div`
  overflow: auto;
`;

export const TableBody = styled.tbody<{ mouseCursor?: boolean }>`
  ${TableRow} {
    &:nth-child(2n) {
      background-color: ${({ theme }) => theme.colors.light};
    }
    &:hover {
      background: ${({ theme }) => theme.colors.primaryLight};
    }
  }
`;

export const TableHeadWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const TableHead = styled.thead``;

export const Icon = styled.i.attrs({ className: "material-icons" })<{
  color?: keyof ThemeType["colors"];
}>`
  font-size: 16px;
  vertical-align: middle;
  ${({ theme, color }) => color && `color: ${theme.colors[color]};`};
`;

export const Button = styled.button<{
  transparent?: boolean;
  link?: boolean;
  background?: keyof ThemeType["colors"];
  color?: keyof ThemeType["colors"];
  icon?: boolean;
}>`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  padding: 4px 8px;
  height: 28px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  
  & i {
    margin-right: ${({ icon }) => icon ? '4px' : '0'};
  }

  ${({ background, theme }) =>
    background && `background: ${theme.colors[background]};`};
  ${({ color, theme }) => color && `color: ${theme.colors[color]};`};

  ${media.lessThan("medium")`
    & div {
      display: none;
    }
    & i {
      margin-right: 0;
    }
  `}
`;
